export type ArrafAuthConfig = {
    auth: {
        handler: (req: Request) => Promise<Response>
        getSession: (req: Request) => Promise<{ user: any; session: any } | null>
    }
}

function remapPathPrefix(req: Request, from: string, to: string): Request {
    const url = new URL(req.url)
    const isExactMatch = url.pathname === from
    const isNestedMatch = url.pathname.startsWith(`${from}/`)

    if (!isExactMatch && !isNestedMatch) return req

    const suffix = url.pathname.slice(from.length)
    url.pathname = `${to}${suffix || ""}`

    return new Request(url.toString(), req)
}

export function toNextHandlers(auth: ArrafAuthConfig["auth"]) {
    const handler = async (req: Request) => {
        const normalizedReq = remapPathPrefix(req, "/api/auth", "/auth")
        return auth.handler(normalizedReq)
    }

    return {
        GET: handler,
        POST: handler,
    }
}

export async function getSession(
    auth: ArrafAuthConfig["auth"],
    req?: Request
) {
    if (!req) {
        const { headers } = await import("next/headers")
        const headersList = await headers()
        const cookieHeader = headersList.get("cookie") ?? ""

        const fakeReq = new Request("http://localhost/auth/session", {
            headers: { cookie: cookieHeader },
        })
        return auth.getSession(fakeReq)
    }

    return auth.getSession(req)
}
