export interface User {
    id: string
    email: string | null
    phone: string | null
    name: string | null
    emailVerified: boolean
    phoneVerified: boolean
    image: string | null
    createdAt: Date
    updatedAt: Date
}

export interface Session {
    id: string
    userId: string
    token: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
    createdAt: Date
}

export interface Account {
    id: string
    userId: string
    providerId: string
    accountId: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpiresAt?: Date
    createdAt: Date
}

export interface Verification {
    id: string
    identifier: string
    token: string
    type: VerificationType
    expiresAt: Date
    attempts: number
    createdAt: Date
}

export type VerificationType =
    | "phone-otp"
    | "email-otp"
    | "email-verification"
    | "password-reset"
    | "phone-change"

export interface SMSProvider {
    send(params: SMSSendParams): Promise<SMSSendResult>
}

export interface SMSSendParams {
    to: string
    message: string
}

export interface SMSSendResult {
    success: boolean
    messageId?: string
    error?: string
}

export interface AuthConfig {
    secret: string
    database: DatabaseAdapter
    session?: SessionConfig
    providers?: OAuthProvider[]
    plugins?: Plugin[]
    sms?: SMSProvider
    otp?: OTPConfig
    trustedOrigins?: string[]
}

export interface OTPConfig {
    length?: number
    expiresIn?: number
    maxAttempts?: number
    messageTemplate?: (otp: string, appName?: string) => string
}

export interface SessionConfig {
    strategy?: "jwt" | "database"
    expiresIn?: string
    cookieName?: string
    cookieOptions?: {
        secure?: boolean
        sameSite?: "strict" | "lax" | "none"
        httpOnly?: boolean
        domain?: string
    }
}

export interface DatabaseAdapter {
    createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>
    findUserById(id: string): Promise<User | null>
    findUserByEmail(email: string): Promise<User | null>
    findUserByPhone(phone: string): Promise<User | null>
    updateUser(id: string, data: Partial<User>): Promise<User>
    deleteUser(id: string): Promise<void>
    createSession(data: Omit<Session, "id" | "createdAt">): Promise<Session>
    findSession(token: string): Promise<Session | null>
    updateSession(token: string, data: Partial<Session>): Promise<Session>
    deleteSession(token: string): Promise<void>
    deleteUserSessions(userId: string): Promise<void>
    createAccount(data: Omit<Account, "id" | "createdAt">): Promise<Account>
    findAccount(providerId: string, accountId: string): Promise<Account | null>
    findAccountsByUserId(userId: string): Promise<Account[]>
    createVerification(data: Omit<Verification, "id" | "createdAt">): Promise<Verification>
    findVerification(identifier: string, type: VerificationType): Promise<Verification | null>
    updateVerification(id: string, data: Partial<Verification>): Promise<Verification>
    deleteVerification(id: string): Promise<void>
    deleteExpiredVerifications(): Promise<void>
}

export interface OAuthProvider {
    id: string
    name: string
    clientId: string
    clientSecret: string
    scopes: string[]
    getAuthorizationUrl(state: string, codeVerifier?: string): string
    exchangeCode(code: string, codeVerifier?: string): Promise<OAuthTokens>
    getUserProfile(accessToken: string): Promise<OAuthProfile>
}

export interface OAuthTokens {
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    tokenType: string
}

export interface OAuthProfile {
    id: string
    email?: string
    phone?: string
    name?: string
    image?: string
    emailVerified?: boolean
}

export interface Plugin {
    id: string
    routes?: Record<string, RouteHandler>
    hooks?: PluginHooks
}

export interface PluginHooks {
    beforeSignIn?: (user: User) => Promise<void>
    afterSignIn?: (user: User, session: Session) => Promise<void>
    beforeSignUp?: (data: Partial<User>) => Promise<void>
    afterSignUp?: (user: User) => Promise<void>
    beforeSignOut?: (session: Session) => Promise<void>
    afterOTPVerified?: (user: User, type: VerificationType) => Promise<void>
}

export type RouteHandler = (req: Request) => Promise<Response>