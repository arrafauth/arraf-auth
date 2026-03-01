import { z } from "zod"
import type { AuthContext } from "../auth"
import { verifyPassword } from "../password"
import { normalizePhone } from "../phone"

const signInSchema = z.discriminatedUnion("method", [
    z.object({
        method: z.literal("email"),
        email: z.string().email(),
        password: z.string(),
    }),
    z.object({
        method: z.literal("phone"),
        phone: z.string(),
    }),
])

export function createSignInRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = signInSchema.safeParse(body)

        if (!parsed.success) {
            return Response.json({ error: "Invalid input" }, { status: 400 })
        }

        if (parsed.data.method === "phone") {
            const normalized = normalizePhone(parsed.data.phone)
            if (!normalized.valid) {
                return Response.json({ error: normalized.error }, { status: 400 })
            }
            return Response.json({
                nextStep: "otp",
                message: "Please verify your phone number with OTP",
            })
        }

        const user = await ctx.adapter.findUserByEmail(parsed.data.email)
        if (!user) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const account = await ctx.adapter.findAccount("credential", user.id)
        if (!account?.accessToken) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const valid = await verifyPassword(parsed.data.password, account.accessToken)
        if (!valid) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 })
        }

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.beforeSignIn?.(user)
        }

        const { session, cookie } = await ctx.sessionManager.createSession(user.id, req)

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.afterSignIn?.(user, session)
        }

        return Response.json(
            { user: { id: user.id, email: user.email, phone: user.phone }, session },
            { headers: { "Set-Cookie": cookie } }
        )
    }
}