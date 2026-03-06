import type { AuthContext } from "../auth"
import {
    generateState,
    generateCodeVerifier,
    generateCodeChallenge,
} from "../oauth"
import { serializeCookie } from "../cookies"
import { localizeError } from "./i18n"

export function createOAuthStartRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const provider = (req as any).params?.provider as string
        const oauthProvider = ctx.config.providers?.find((p) => p.id === provider)

        if (!oauthProvider) {
            return Response.json({ error: localizeError(`Provider "${provider}" not configured`) }, { status: 404 })
        }

        const state = generateState()
        const codeVerifier = await generateCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        const stateCookie = serializeCookie("oauth_state", state, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 600,
        })

        const verifierCookie = serializeCookie("oauth_verifier", codeVerifier, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 600,
        })

        const authUrl = oauthProvider.getAuthorizationUrl(state, codeChallenge)

        const headers = new Headers()
        headers.append("Location", authUrl)
        headers.append("Set-Cookie", stateCookie)
        headers.append("Set-Cookie", verifierCookie)

        return new Response(null, {
            status: 302,
            headers,
        })
    }
}
