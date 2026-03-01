import type { OAuthProvider, OAuthTokens, OAuthProfile } from "@arraf-auth/core"
import {
    buildAuthorizationUrl,
    exchangeCodeForTokens,
} from "@arraf-auth/core"

export interface GoogleProviderConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes?: string[]
}

interface GoogleTokenResponse {
    access_token: string
    refresh_token?: string
    expires_in: number
    token_type: string
    id_token?: string
}

interface GoogleUserProfile {
    sub: string
    email: string
    email_verified: boolean
    name: string
    picture?: string
    given_name?: string
    family_name?: string
}

export function google(config: GoogleProviderConfig): OAuthProvider {
    const scopes = config.scopes ?? [
        "openid",
        "email",
        "profile",
    ]

    return {
        id: "google",
        name: "Google",
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes,

        getAuthorizationUrl(state: string, codeVerifier?: string) {
            const params: Record<string, string> = {
                client_id: config.clientId,
                redirect_uri: config.redirectUri,
                response_type: "code",
                scope: scopes.join(" "),
                state,
                access_type: "offline",
                prompt: "consent",
            }

            if (codeVerifier) {
                params.code_challenge_method = "S256"
            }

            return buildAuthorizationUrl(
                "https://accounts.google.com/o/oauth2/v2/auth",
                params
            )
        },

        async exchangeCode(code: string, codeVerifier?: string) {
            const params: Record<string, string> = {
                code,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri,
                grant_type: "authorization_code",
            }

            if (codeVerifier) {
                params.code_verifier = codeVerifier
            }

            const response = await exchangeCodeForTokens(
                "https://oauth2.googleapis.com/token",
                params
            )

            if (!response.ok) {
                const error = await response.text()
                throw new Error(`Google token exchange failed: ${error}`)
            }

            const tokens: GoogleTokenResponse = await response.json()

            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresIn: tokens.expires_in,
                tokenType: tokens.token_type,
            } satisfies OAuthTokens
        },

        async getUserProfile(accessToken: string) {
            const response = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )

            if (!response.ok) {
                throw new Error("Failed to fetch Google user profile")
            }

            const profile: GoogleUserProfile = await response.json()

            return {
                id: profile.sub,
                email: profile.email,
                name: profile.name,
                image: profile.picture,
                emailVerified: profile.email_verified,
            } satisfies OAuthProfile
        },
    }
}
