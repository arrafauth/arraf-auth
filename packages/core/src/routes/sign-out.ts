import type { AuthContext } from "../auth"

export function createSignOutRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const clearCookie = await ctx.sessionManager.deleteSession(req)
        return Response.json(
            { success: true },
            { headers: { "Set-Cookie": clearCookie } }
        )
    }
}