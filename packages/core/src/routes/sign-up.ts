import { z } from "zod"
import type { AuthContext } from "../auth"
import { hashPassword } from "../password"

const signUpSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(8).optional(),
    name: z.string().optional(),
}).refine(
    (d) => d.email || d.phone,
    { message: "Either email or phone is required" }
).refine(
    (d) => !d.email || d.password,
    { message: "Password is required when signing up with email" }
)

export function createSignUpRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = signUpSchema.safeParse(body)

        if (!parsed.success) {
            return Response.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { email, phone, password, name } = parsed.data

        if (email) {
            const existing = await ctx.adapter.findUserByEmail(email)
            if (existing) return Response.json({ error: "Email already in use" }, { status: 409 })
        }

        if (phone) {
            const existing = await ctx.adapter.findUserByPhone(phone)
            if (existing) return Response.json({ error: "Phone already in use" }, { status: 409 })
        }

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.beforeSignUp?.({ email, phone })
        }

        const user = await ctx.adapter.createUser({
            email: email ?? null,
            phone: phone ?? null,
            name: name ?? null,
            emailVerified: false,
            phoneVerified: false,
            image: null,
        })

        if (email && password) {
            const hash = await hashPassword(password)
            await ctx.adapter.createAccount({
                userId: user.id,
                providerId: "credential",
                accountId: user.id,
                accessToken: hash,
            })
        }

        if (phone) {
            await ctx.adapter.createAccount({
                userId: user.id,
                providerId: "phone",
                accountId: phone,
            })
        }

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.afterSignUp?.(user)
        }

        const { session, cookie } = await ctx.sessionManager.createSession(user.id, req)

        return Response.json(
            { user: { id: user.id, email: user.email, phone: user.phone }, session },
            { status: 201, headers: { "Set-Cookie": cookie } }
        )
    }
}