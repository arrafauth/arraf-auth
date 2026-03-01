export type ArrafAuthConfig = {
    auth: {
        handler: (req: Request) => Promise<Response>
        getSession: (req: Request) => Promise<{ user: any; session: any } | null>
    }
}

export function toNextHandlers(auth: ArrafAuthConfig["auth"]) {
    const handler = async (req: Request) => {
        return auth.handler(req)
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