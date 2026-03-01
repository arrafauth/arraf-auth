import {
    pgTable,
    text,
    boolean,
    timestamp,
    integer,
    pgEnum,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core"

const createId = (): string => {
    const cryptoApi = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto
    if (cryptoApi?.randomUUID) return cryptoApi.randomUUID()
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const verificationTypeEnum = pgEnum("verification_type", [
    "phone_otp",
    "email_otp",
    "email_verification",
    "password_reset",
    "phone_change",
])

export const users = pgTable("users", {
    id: text("id").primaryKey().$defaultFn(createId),
    email: text("email").unique(),
    phone: text("phone").unique(),
    name: text("name"),
    emailVerified: boolean("email_verified").notNull().default(false),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
    tokenIdx: index("sessions_token_idx").on(t.token),
}))

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
    providerAccountIdx: uniqueIndex("accounts_provider_account_idx").on(t.providerId, t.accountId),
    userIdx: index("accounts_user_idx").on(t.userId),
}))

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey().$defaultFn(createId),
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    type: verificationTypeEnum("type").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
    identifierTypeIdx: uniqueIndex("verifications_identifier_type_idx").on(t.identifier, t.type),
    identifierIdx: index("verifications_identifier_idx").on(t.identifier),
}))

export type UserRecord = typeof users.$inferSelect
export type SessionRecord = typeof sessions.$inferSelect
export type AccountRecord = typeof accounts.$inferSelect
export type VerificationRecord = typeof verifications.$inferSelect
