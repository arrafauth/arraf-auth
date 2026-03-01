import type { AuthContext } from "../auth"
import { parseCookies, serializeCookie } from "../cookies"

type OAuthCallbackRequest = Request & {
    params?: {
        provider?: string
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    return "OAuth callback failed"
}

export function createOAuthCallbackRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const provider = (req as OAuthCallbackRequest).params?.provider
        if (!provider) {
            return Response.json({ error: "Provider not found" }, { status: 404 })
        }

        const oauthProvider = ctx.config.providers?.find((p) => p.id === provider)
        if (!oauthProvider) {
            return Response.json({ error: "Provider not found" }, { status: 404 })
        }

        const url = new URL(req.url)
        const code = url.searchParams.get("code")
        const state = url.searchParams.get("state")
        const error = url.searchParams.get("error")

        if (error) {
            return Response.json({ error: `OAuth denied: ${error}` }, { status: 400 })
        }

        if (!code || !state) {
            return Response.json({ error: "Missing code or state" }, { status: 400 })
        }

        const cookies = parseCookies(req.headers.get("cookie") ?? "")
        const savedState = cookies["oauth_state"]
        const codeVerifier = cookies["oauth_verifier"]

        if (!savedState || savedState !== state) {
            return Response.json({ error: "Invalid state - possible CSRF attack" }, { status: 400 })
        }

        let tokens
        try {
            tokens = await oauthProvider.exchangeCode(code, codeVerifier)
        } catch (error: unknown) {
            return Response.json({ error: getErrorMessage(error) }, { status: 400 })
        }

        let profile
        try {
            profile = await oauthProvider.getUserProfile(tokens.accessToken)
        } catch (error: unknown) {
            return Response.json({ error: getErrorMessage(error) }, { status: 400 })
        }

        if (!profile.email) {
            return Response.json({ error: "Provider did not return an email" }, { status: 400 })
        }

        let user = await ctx.adapter.findUserByEmail(profile.email)

        if (!user) {
            for (const plugin of ctx.plugins) {
                await plugin.hooks?.beforeSignUp?.({ email: profile.email })
            }

            user = await ctx.adapter.createUser({
                email: profile.email,
                phone: null,
                name: profile.name ?? null,
                emailVerified: profile.emailVerified ?? false,
                phoneVerified: false,
                image: profile.image ?? null,
            })

            for (const plugin of ctx.plugins) {
                await plugin.hooks?.afterSignUp?.(user)
            }
        }

        const existingAccount = await ctx.adapter.findAccount(
            oauthProvider.id,
            profile.id
        )

        if (!existingAccount) {
            await ctx.adapter.createAccount({
                userId: user.id,
                providerId: oauthProvider.id,
                accountId: profile.id,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessTokenExpiresAt: tokens.expiresIn
                    ? new Date(Date.now() + tokens.expiresIn * 1000)
                    : undefined,
            })
        }

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.beforeSignIn?.(user)
        }

        const { session, cookie } = await ctx.sessionManager.createSession(
            user.id,
            req
        )

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.afterSignIn?.(user, session)
        }

        const clearState = serializeCookie("oauth_state", "", { maxAge: 0 })
        const clearVerifier = serializeCookie("oauth_verifier", "", { maxAge: 0 })

        const redirectTo = url.searchParams.get("redirectTo") ?? "/"

        const headers = new Headers()
        headers.append("Location", redirectTo)
        headers.append("Set-Cookie", cookie)
        headers.append("Set-Cookie", clearState)
        headers.append("Set-Cookie", clearVerifier)

        return new Response(null, { status: 302, headers })
    }
}
