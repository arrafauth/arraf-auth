import type { AuthConfig, DatabaseAdapter, Plugin } from "./types"
import { SessionManager } from "./session"
import { Router } from "./router"
import { createSignUpRoute } from "./routes/sign-up"
import { createSignInRoute } from "./routes/sign-in"
import { createSignOutRoute } from "./routes/sign-out"
import { createGetSessionRoute } from "./routes/session"
import { createSendOTPRoute } from "./routes/otp-send"
import { createVerifyOTPRoute } from "./routes/otp-verify"
import { createOAuthStartRoute } from "./routes/oauth-start"
import { createOAuthCallbackRoute } from "./routes/oauth-callback"

export interface AuthContext {
    adapter: DatabaseAdapter
    sessionManager: SessionManager
    config: AuthConfig
    plugins: Plugin[]
}

export function createAuth(config: AuthConfig) {
    const plugins = config.plugins ?? []

    const sessionManager = new SessionManager(
        config.database,
        config.session ?? {},
        config.secret
    )

    const ctx: AuthContext = {
        adapter: config.database,
        sessionManager,
        config,
        plugins,
    }

    const router = new Router()

    if (config.providers && config.providers.length > 0) {
        router.add("GET", "/sign-in/:provider", createOAuthStartRoute(ctx))
        router.add("GET", "/callback/:provider", createOAuthCallbackRoute(ctx))
    }

    router.add("POST", "/sign-up", createSignUpRoute(ctx))
    router.add("POST", "/sign-in", createSignInRoute(ctx))
    router.add("POST", "/sign-out", createSignOutRoute(ctx))
    router.add("GET", "/session", createGetSessionRoute(ctx))

    router.add("POST", "/otp/send", createSendOTPRoute(ctx))
    router.add("POST", "/otp/verify", createVerifyOTPRoute(ctx))

    for (const plugin of plugins) {
        if (plugin.routes) {
            for (const [key, handler] of Object.entries(plugin.routes)) {
                const [method, path] = key.split(" ")
                router.add(method, path, handler)
            }
        }
    }

    const handler = (req: Request) => router.handle(req, "/auth")

    return {
        handler,
        getSession: (req: Request) => sessionManager.getSession(req),
        $context: ctx,
    }
}