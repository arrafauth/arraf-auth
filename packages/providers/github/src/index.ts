import type { OAuthProvider, OAuthTokens, OAuthProfile } from "@arraf-auth/core"
import {
    buildAuthorizationUrl,
    exchangeCodeForTokens,
} from "@arraf-auth/core"

export interface GitHubProviderConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes?: string[]
}

interface GitHubTokenResponse {
    access_token: string
    token_type: string
    scope: string
}

interface GitHubUserProfile {
    id: number
    login: string
    name: string | null
    email: string | null
    avatar_url: string
}

interface GitHubEmail {
    email: string
    primary: boolean
    verified: boolean
    visibility: string | null
}

export function github(config: GitHubProviderConfig): OAuthProvider {
    const scopes = config.scopes ?? [
        "read:user",
        "user:email",
    ]

    return {
        id: "github",
        name: "GitHub",
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes,

        getAuthorizationUrl(state: string) {
            return buildAuthorizationUrl(
                "https://github.com/login/oauth/authorize",
                {
                    client_id: config.clientId,
                    redirect_uri: config.redirectUri,
                    scope: scopes.join(" "),
                    state,
                }
            )
        },

        async exchangeCode(code: string) {
            const response = await exchangeCodeForTokens(
                "https://github.com/login/oauth/access_token",
                {
                    code,
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    redirect_uri: config.redirectUri,
                }
            )

            if (!response.ok) {
                throw new Error("GitHub token exchange failed")
            }

            const tokens: GitHubTokenResponse = await response.json()

            if (!tokens.access_token) {
                throw new Error("GitHub did not return an access token")
            }

            return {
                accessToken: tokens.access_token,
                tokenType: tokens.token_type,
            } satisfies OAuthTokens
        },

        async getUserProfile(accessToken: string) {
            const profileResponse = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json",
                },
            })

            if (!profileResponse.ok) {
                throw new Error("Failed to fetch GitHub user profile")
            }

            const profile: GitHubUserProfile = await profileResponse.json()

            let primaryEmail = profile.email

            if (!primaryEmail) {
                const emailsResponse = await fetch(
                    "https://api.github.com/user/emails",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: "application/vnd.github+json",
                        },
                    }
                )

                if (emailsResponse.ok) {
                    const emails: GitHubEmail[] = await emailsResponse.json()
                    const primary = emails.find((e) => e.primary && e.verified)
                    primaryEmail = primary?.email ?? null
                }
            }

            if (!primaryEmail) {
                throw new Error("Could not retrieve email from GitHub account")
            }

            return {
                id: String(profile.id),
                email: primaryEmail,
                name: profile.name ?? profile.login,
                image: profile.avatar_url,
                emailVerified: true,
            } satisfies OAuthProfile
        },
    }
}
