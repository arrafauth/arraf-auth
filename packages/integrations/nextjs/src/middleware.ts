import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { ArrafAuthConfig } from "./index"

export interface MiddlewareConfig {
    auth: ArrafAuthConfig["auth"]
    protectedRoutes?: string[]
    publicRoutes?: string[]
    redirectTo?: string
    afterLoginRedirect?: string
}

export function createAuthMiddleware(config: MiddlewareConfig) {
    return async function middleware(req: NextRequest) {
        const { pathname } = req.nextUrl

        if (pathname.startsWith("/auth")) {
            return NextResponse.next()
        }

        const publicRoutes = config.publicRoutes ?? ["/", "/login", "/signup"]
        if (publicRoutes.some((route) => pathname.startsWith(route))) {
            return NextResponse.next()
        }

        const protectedRoutes = config.protectedRoutes ?? []
        const isProtected =
            protectedRoutes.length === 0 ||
            protectedRoutes.some((route) => pathname.startsWith(route))

        if (!isProtected) return NextResponse.next()

        const cookieHeader = req.headers.get("cookie") ?? ""
        const fakeReq = new Request(req.url, {
            headers: { cookie: cookieHeader },
        })

        const session = await config.auth.getSession(fakeReq)

        if (!session) {
            const redirectTo = config.redirectTo ?? "/login"
            const url = req.nextUrl.clone()
            url.pathname = redirectTo
            url.searchParams.set("callbackUrl", pathname)
            return NextResponse.redirect(url)
        }

        const response = NextResponse.next()
        response.headers.set("x-user-id", session.user.id)
        response.headers.set("x-user-email", session.user.email ?? "")
        return response
    }
}

export const defaultMatcher = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
    ],
}