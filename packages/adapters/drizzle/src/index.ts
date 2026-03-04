import { eq, and, lt } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type {
    DatabaseAdapter,
    User,
    Session,
    Account,
    Verification,
    VerificationType,
} from "@arraf-auth/core"
import {
    users,
    sessions,
    accounts,
    verifications,
} from "./schema"

type DrizzleDB = PostgresJsDatabase
type DbVerificationType =
    | "phone_otp"
    | "email_otp"
    | "email_verification"
    | "password_reset"
    | "phone_change"

function toVerificationType(type: DbVerificationType): VerificationType {
    return type.replace("_", "-") as VerificationType
}

function fromVerificationType(type: VerificationType): DbVerificationType {
    return type.replace("-", "_") as DbVerificationType
}

export function drizzleAdapter(db: DrizzleDB): DatabaseAdapter {
    return {
        async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
            const [user] = await db.insert(users).values(data).returning()
            return user as User
        },

        async findUserById(id: string): Promise<User | null> {
            const [user] = await db.select().from(users).where(eq(users.id, id))
            return (user as User) ?? null
        },

        async findUserByEmail(email: string): Promise<User | null> {
            const [user] = await db.select().from(users).where(eq(users.email, email))
            return (user as User) ?? null
        },

        async findUserByPhone(phone: string): Promise<User | null> {
            const [user] = await db.select().from(users).where(eq(users.phone, phone))
            return (user as User) ?? null
        },

        async updateUser(id: string, data: Partial<User>): Promise<User> {
            const [user] = await db
                .update(users)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(users.id, id))
                .returning()
            return user as User
        },

        async deleteUser(id: string): Promise<void> {
            await db.delete(users).where(eq(users.id, id))
        },

        async createSession(data: Omit<Session, "id" | "createdAt">): Promise<Session> {
            const [session] = await db
                .insert(sessions)
                .values(data as typeof sessions.$inferInsert)
                .returning()
            return session as Session
        },

        async findSession(token: string): Promise<Session | null> {
            const [session] = await db
                .select()
                .from(sessions)
                .where(eq(sessions.token, token))
            return (session as Session) ?? null
        },

        async updateSession(token: string, data: Partial<Session>): Promise<Session> {
            const [session] = await db
                .update(sessions)
                .set(data)
                .where(eq(sessions.token, token))
                .returning()
            return session as Session
        },

        async updateAccount(id: string, data: Partial<Account>) {
            const [account] = await db
                .update(accounts)
                .set(data)
                .where(eq(accounts.id, id))
                .returning()
            return account as Account
        },

        async deleteSession(token: string): Promise<void> {
            await db.delete(sessions).where(eq(sessions.token, token))
        },

        async deleteUserSessions(userId: string): Promise<void> {
            await db.delete(sessions).where(eq(sessions.userId, userId))
        },

        async createAccount(data: Omit<Account, "id" | "createdAt">): Promise<Account> {
            const [account] = await db
                .insert(accounts)
                .values(data as typeof accounts.$inferInsert)
                .returning()
            return account as Account
        },

        async findAccount(providerId: string, accountId: string): Promise<Account | null> {
            const [account] = await db
                .select()
                .from(accounts)
                .where(
                    and(
                        eq(accounts.providerId, providerId),
                        eq(accounts.accountId, accountId)
                    )
                )
            return (account as Account) ?? null
        },

        async findAccountsByUserId(userId: string): Promise<Account[]> {
            const result = await db
                .select()
                .from(accounts)
                .where(eq(accounts.userId, userId))
            return result as Account[]
        },

        async createVerification(data: Omit<Verification, "id" | "createdAt">): Promise<Verification> {
            const values = {
                ...data,
                type: fromVerificationType(data.type),
            } as typeof verifications.$inferInsert
            const [verification] = await db
                .insert(verifications)
                .values(values)
                .returning()
            return {
                ...verification,
                type: toVerificationType(verification.type),
            } as Verification
        },

        async findVerification(identifier: string, type: VerificationType): Promise<Verification | null> {
            const [verification] = await db
                .select()
                .from(verifications)
                .where(
                    and(
                        eq(verifications.identifier, identifier),
                        eq(verifications.type, fromVerificationType(type))
                    )
                )
            if (!verification) return null
            return {
                ...verification,
                type: toVerificationType(verification.type),
            } as Verification
        },

        async updateVerification(id: string, data: Partial<Verification>): Promise<Verification> {
            const [verification] = await db
                .update(verifications)
                .set({
                    ...data,
                    type: data.type ? fromVerificationType(data.type) : undefined,
                })
                .where(eq(verifications.id, id))
                .returning()
            return {
                ...verification,
                type: toVerificationType(verification.type),
            } as Verification
        },

        async deleteVerification(id: string): Promise<void> {
            await db.delete(verifications).where(eq(verifications.id, id))
        },

        async deleteExpiredVerifications(): Promise<void> {
            await db
                .delete(verifications)
                .where(lt(verifications.expiresAt, new Date()))
        },
    }
}

export { users, sessions, accounts, verifications } from "./schema"
export type { UserRecord, SessionRecord, AccountRecord, VerificationRecord } from "./schema"
