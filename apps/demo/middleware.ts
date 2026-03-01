import { createAuthMiddleware, defaultMatcher } from "@arraf-auth/nextjs/middleware"
import { auth } from "@/lib/auth"

export default createAuthMiddleware({
    auth,
    protectedRoutes: ["/dashboard"],
    publicRoutes: ["/", "/login"],
    redirectTo: "/login",
})

export const config = defaultMatcher