import type { DatabaseAdapter, Session, SessionConfig, User } from "./types"
import { generateSessionToken, signJWT, verifyJWT } from "./tokens"
import { parseCookies, serializeCookie } from "./cookies"

export class SessionManager {
    constructor(
        private adapter: DatabaseAdapter,
        private config: SessionConfig,
        private secret: string
    ) { }

    async createSession(
        userId: string,
        req: Request
    ): Promise<{ session: Session; cookie: string }> {
        const token = generateSessionToken()
        const expiresAt = this.getExpiry()

        const session = await this.adapter.createSession({
            userId,
            token,
            expiresAt,
            ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
            userAgent: req.headers.get("user-agent") ?? undefined,
        })

        const cookieValue =
            this.config.strategy === "jwt"
                ? await signJWT({ userId, sessionId: session.id, email: "" }, this.secret)
                : token

        const cookie = serializeCookie(
            this.config.cookieName ?? "auth_session",
            cookieValue,
            {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                maxAge: this.getExpirySeconds(),
                ...this.config.cookieOptions,
            }
        )

        return { session, cookie }
    }

    async getSession(req: Request): Promise<{ user: User; session: Session } | null> {
        const cookieHeader = req.headers.get("cookie") ?? ""
        const cookies = parseCookies(cookieHeader)
        const token = cookies[this.config.cookieName ?? "auth_session"]

        if (!token) return null

        if (this.config.strategy === "jwt") {
            const payload = await verifyJWT(token, this.secret)
            if (!payload) return null
            const session = await this.adapter.findSession(payload.sessionId)
            if (!session || session.expiresAt < new Date()) return null
            const user = await this.adapter.findUserById(payload.userId)
            if (!user) return null
            return { user, session }
        }

        const session = await this.adapter.findSession(token)
        if (!session || session.expiresAt < new Date()) return null
        const user = await this.adapter.findUserById(session.userId)
        if (!user) return null
        return { user, session }
    }

    async deleteSession(req: Request): Promise<string> {
        const cookieHeader = req.headers.get("cookie") ?? ""
        const cookies = parseCookies(cookieHeader)
        const token = cookies[this.config.cookieName ?? "auth_session"]
        if (token) await this.adapter.deleteSession(token)

        return serializeCookie(this.config.cookieName ?? "auth_session", "", {
            maxAge: 0,
        })
    }

    private getExpiry(): Date {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        return d
    }

    private getExpirySeconds(): number {
        return 60 * 60 * 24 * 30
    }
}