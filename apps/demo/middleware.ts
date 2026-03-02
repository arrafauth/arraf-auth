import { createAuthMiddleware } from "@arraf-auth/nextjs/middleware"
import { auth } from "@/lib/auth"

export default createAuthMiddleware({
    auth,
    protectedRoutes: ["/dashboard"],
    publicRoutes: ["/", "/login"],
    redirectTo: "/login",
})

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
    ],
}