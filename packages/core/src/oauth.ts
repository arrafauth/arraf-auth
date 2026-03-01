export async function generateCodeVerifier(): Promise<string> {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return base64UrlEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest("SHA-256", data)
    return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "")
}

export function generateState(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return base64UrlEncode(array)
}

export function buildAuthorizationUrl(
    baseUrl: string,
    params: Record<string, string>
): string {
    const url = new URL(baseUrl)
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
    }
    return url.toString()
}

export async function exchangeCodeForTokens(
    tokenUrl: string,
    params: Record<string, string>
): Promise<Response> {
    return fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString(),
    })
}