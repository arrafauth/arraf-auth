import type { AuthContext } from "../auth"

export function createGetSessionRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const result = await ctx.sessionManager.getSession(req)
        if (!result) {
            return Response.json({ session: null, user: null })
        }
        return Response.json({
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                image: result.user.image,
            },
            session: {
                id: result.session.id,
                expiresAt: result.session.expiresAt,
            },
        })
    }
}