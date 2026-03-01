import type { Request, Response, NextFunction, RequestHandler } from "express"

export interface ArrafAuthConfig {
    auth: {
        handler: (req: globalThis.Request) => Promise<globalThis.Response>
        getSession: (req: globalThis.Request) => Promise<{ user: any; session: any } | null>
    }
}

function toWebRequest(req: Request): globalThis.Request {
    const protocol = req.protocol ?? "http"
    const host = req.get("host") ?? "localhost"
    const url = `${protocol}://${host}${req.originalUrl}`

    return new globalThis.Request(url, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body:
            req.method !== "GET" && req.method !== "HEAD"
                ? JSON.stringify(req.body)
                : undefined,
    })
}

async function sendWebResponse(
    webRes: globalThis.Response,
    res: Response
): Promise<void> {
    res.status(webRes.status)

    webRes.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
            res.append("Set-Cookie", value)
        } else {
            res.setHeader(key, value)
        }
    })

    const body = await webRes.text()
    res.send(body)
}

export function arrafAuth(config: ArrafAuthConfig): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const webReq = toWebRequest(req)
            const webRes = await config.auth.handler(webReq)
            await sendWebResponse(webRes, res)
        } catch (err) {
            next(err)
        }
    }
}

export function sessionMiddleware(config: ArrafAuthConfig): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const webReq = toWebRequest(req)
            const session = await config.auth.getSession(webReq)
                ; (req as any).auth = session
            next()
        } catch {
            ; (req as any).auth = null
            next()
        }
    }
}

export function requireAuth(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const auth = (req as any).auth
        if (!auth?.user) {
            res.status(401).json({ error: "Unauthorized" })
            return
        }
        next()
    }
}