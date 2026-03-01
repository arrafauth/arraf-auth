import { Hono } from "hono"
import type { Context, MiddlewareHandler } from "hono"
import { createMiddleware } from "hono/factory"

export interface ArrafAuthConfig {
    auth: {
        handler: (req: Request) => Promise<Response>
        getSession: (req: Request) => Promise<{ user: any; session: any } | null>
    }
    basePath?: string
}

export function arrafAuth(config: ArrafAuthConfig) {
    const app = new Hono()
    const base = config.basePath ?? ""

    app.all(`${base}/*`, async (c: Context) => {
        const res = await config.auth.handler(c.req.raw)
        return res
    })

    return app
}

export const sessionMiddleware = (
    config: ArrafAuthConfig
): MiddlewareHandler => {
    return createMiddleware(async (c, next) => {
        const session = await config.auth.getSession(c.req.raw)
        c.set("user", session?.user ?? null)
        c.set("session", session?.session ?? null)
        await next()
    })
}

export const requireAuth = (): MiddlewareHandler => {
    return createMiddleware(async (c, next) => {
        const user = c.get("user")
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401)
        }
        await next()
    })
}

export type AuthVariables = {
    user: {
        id: string
        email: string | null
        phone: string | null
        name: string | null
    } | null
    session: {
        id: string
        expiresAt: Date
    } | null
}