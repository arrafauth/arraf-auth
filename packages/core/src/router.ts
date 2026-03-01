import type { RouteHandler } from "./types"

export class Router {
    private routes = new Map<string, RouteHandler>()
    private dynamicRoutes: Array<{
        method: string
        pattern: RegExp
        keys: string[]
        handler: RouteHandler
    }> = []

    add(method: string, path: string, handler: RouteHandler) {
        if (path.includes(":")) {
            const keys: string[] = []
            const pattern = new RegExp(
                "^" + path.replace(/:([^/]+)/g, (_, key) => {
                    keys.push(key)
                    return "([^/]+)"
                }) + "$"
            )
            this.dynamicRoutes.push({ method: method.toUpperCase(), pattern, keys, handler })
        } else {
            this.routes.set(`${method.toUpperCase()}:${path}`, handler)
        }
    }

    async handle(req: Request, basePath: string = "/auth"): Promise<Response> {
        const url = new URL(req.url)
        const path = url.pathname.replace(basePath, "") || "/"

        const staticHandler = this.routes.get(`${req.method}:${path}`)
        if (staticHandler) {
            try { return await staticHandler(req) }
            catch (err) {
                console.error("[auth] Route error:", err)
                return new Response("Internal Server Error", { status: 500 })
            }
        }

        for (const route of this.dynamicRoutes) {
            if (route.method !== req.method) continue
            const match = path.match(route.pattern)
            if (match) {
                const params = Object.fromEntries(
                    route.keys.map((key, i) => [key, match[i + 1]])
                )
                    ; (req as any).params = params
                try { return await route.handler(req) }
                catch (err) {
                    console.error("[auth] Route error:", err)
                    return new Response("Internal Server Error", { status: 500 })
                }
            }
        }

        return new Response("Not Found", { status: 404 })
    }
}