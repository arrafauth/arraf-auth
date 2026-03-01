export interface CookieOptions {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: "strict" | "lax" | "none"
    maxAge?: number
    path?: string
    domain?: string
}

export function serializeCookie(
    name: string,
    value: string,
    options: CookieOptions = {}
): string {
    const {
        httpOnly = true,
        secure = true,
        sameSite = "lax",
        maxAge,
        path = "/",
        domain
    } = options

    let cookie = `${name}=${encodeURIComponent(value)}`
    if (httpOnly) cookie += "; HttpOnly"
    if (secure) cookie += "; Secure"
    if (sameSite) cookie += `; SameSite=${sameSite}`
    if (maxAge) cookie += `; Max-Age=${maxAge}`
    if (path) cookie += `; Path=${path}`
    if (domain) cookie += `; Domain=${domain}`

    return cookie
}

export function parseCookies(cookieHeader: string): Record<string, string> {
    return Object.fromEntries(
        cookieHeader.split(";").map(c => {
            const [k, ...v] = c.trim().split("=")
            return [k.trim(), decodeURIComponent(v.join("="))]
        })
    )
}