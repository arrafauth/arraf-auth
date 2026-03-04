import type {
    DatabaseAdapter,
    User,
    Session,
    Account,
    Verification,
    VerificationType,
} from "@arraf-auth/core"

function toVerificationType(type: string): VerificationType {
    return type.replace("_", "-") as VerificationType
}

function fromVerificationType(type: VerificationType): string {
    return type.replace("-", "_")
}

export function prismaAdapter(client: any): DatabaseAdapter {
    return {
        async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
            const user = await client.user.create({ data })
            return user as User
        },

        async findUserById(id: string): Promise<User | null> {
            const user = await client.user.findUnique({ where: { id } })
            return user as User | null
        },

        async findUserByEmail(email: string): Promise<User | null> {
            const user = await client.user.findUnique({ where: { email } })
            return user as User | null
        },

        async findUserByPhone(phone: string): Promise<User | null> {
            const user = await client.user.findUnique({ where: { phone } })
            return user as User | null
        },

        async updateUser(id: string, data: Partial<User>): Promise<User> {
            const user = await client.user.update({ where: { id }, data })
            return user as User
        },

        async deleteUser(id: string): Promise<void> {
            await client.user.delete({ where: { id } })
        },

        async createSession(data: Omit<Session, "id" | "createdAt">): Promise<Session> {
            const session = await client.session.create({ data })
            return session as Session
        },

        async findSession(token: string): Promise<Session | null> {
            const session = await client.session.findUnique({ where: { token } })
            return session as Session | null
        },

        async updateSession(token: string, data: Partial<Session>): Promise<Session> {
            const session = await client.session.update({ where: { token }, data })
            return session as Session
        },

        async updateAccount(id: string, data: Partial<Account>) {
            const account = await client.account.update({
                where: { id },
                data,
            })
            return account as Account
        },

        async deleteSession(token: string): Promise<void> {
            await client.session.delete({ where: { token } }).catch(() => undefined)
        },

        async deleteUserSessions(userId: string): Promise<void> {
            await client.session.deleteMany({ where: { userId } })
        },

        async createAccount(data: Omit<Account, "id" | "createdAt">): Promise<Account> {
            const account = await client.account.create({ data })
            return account as Account
        },

        async findAccount(providerId: string, accountId: string): Promise<Account | null> {
            const account = await client.account.findUnique({
                where: { providerId_accountId: { providerId, accountId } },
            })
            return account as Account | null
        },

        async findAccountsByUserId(userId: string): Promise<Account[]> {
            const accounts = await client.account.findMany({ where: { userId } })
            return accounts as Account[]
        },

        async createVerification(data: Omit<Verification, "id" | "createdAt">): Promise<Verification> {
            const verification = await client.verification.create({
                data: {
                    ...data,
                    type: fromVerificationType(data.type),
                },
            })
            return {
                ...verification,
                type: toVerificationType(verification.type),
            } as Verification
        },

        async findVerification(identifier: string, type: VerificationType): Promise<Verification | null> {
            const verification = await client.verification.findUnique({
                where: {
                    identifier_type: {
                        identifier,
                        type: fromVerificationType(type),
                    },
                },
            })
            if (!verification) return null
            return {
                ...verification,
                type: toVerificationType(verification.type),
            } as Verification
        },

        async updateVerification(id: string, data: Partial<Verification>): Promise<Verification> {
            const verification = await client.verification.update({
                where: { id },
                data: {
                    ...data,
                    type: data.type ? fromVerificationType(data.type) : undefined,
                },
            })
            return {
                ...verification,
                type: toVerificationType(verification.type),
            } as Verification
        },

        async deleteVerification(id: string): Promise<void> {
            await client.verification.delete({ where: { id } }).catch(() => undefined)
        },

        async deleteExpiredVerifications(): Promise<void> {
            await client.verification.deleteMany({
                where: { expiresAt: { lt: new Date() } },
            })
        },
    }
}
