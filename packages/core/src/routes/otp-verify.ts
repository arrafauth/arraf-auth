import { z } from "zod"
import type { AuthContext } from "../auth"
import { normalizePhone } from "../phone"
import { verifyOTP } from "../otp"

const verifyOTPSchema = z.discriminatedUnion("method", [
    z.object({
        method: z.literal("phone"),
        phone: z.string(),
        otp: z.string().length(6),
        name: z.string().optional(),
    }),
    z.object({
        method: z.literal("email"),
        email: z.string().email(),
        otp: z.string().length(6),
        name: z.string().optional(),
    }),
])

export function createVerifyOTPRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = verifyOTPSchema.safeParse(body)

        if (!parsed.success) {
            return Response.json({ error: "Invalid input" }, { status: 400 })
        }

        let identifier: string
        let isPhone = false

        if (parsed.data.method === "phone") {
            const normalized = normalizePhone(parsed.data.phone)
            if (!normalized.valid || !normalized.normalized) {
                return Response.json({ error: normalized.error }, { status: 400 })
            }
            identifier = normalized.normalized
            isPhone = true
        } else {
            identifier = parsed.data.email
        }

        const result = await verifyOTP({
            identifier,
            otp: parsed.data.otp,
            type: isPhone ? "phone-otp" : "email-otp",
            adapter: ctx.adapter,
            maxAttempts: ctx.config.otp?.maxAttempts ?? 5,
        })

        if (!result.valid) {
            return Response.json({ error: result.error }, { status: 401 })
        }

        let user = isPhone
            ? await ctx.adapter.findUserByPhone(identifier)
            : await ctx.adapter.findUserByEmail(identifier)

        if (!user) {
            for (const plugin of ctx.plugins) {
                await plugin.hooks?.beforeSignUp?.({
                    phone: isPhone ? identifier : undefined,
                    email: !isPhone ? identifier : undefined,
                })
            }

            user = await ctx.adapter.createUser({
                email: isPhone ? null : identifier,
                phone: isPhone ? identifier : null,
                name: parsed.data.name ?? null,
                emailVerified: false,
                phoneVerified: isPhone,
                image: null,
            })

            await ctx.adapter.createAccount({
                userId: user.id,
                providerId: isPhone ? "phone" : "email-otp",
                accountId: identifier,
                accessToken: undefined,
            })

            for (const plugin of ctx.plugins) {
                await plugin.hooks?.afterSignUp?.(user)
            }
        } else {
            if (isPhone && !user.phoneVerified) {
                user = await ctx.adapter.updateUser(user.id, { phoneVerified: true })
            }
            for (const plugin of ctx.plugins) {
                await plugin.hooks?.afterSignIn?.(user, {} as any)
            }
        }

        const { session, cookie } = await ctx.sessionManager.createSession(user.id, req)

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.afterOTPVerified?.(user, isPhone ? "phone-otp" : "email-otp")
        }

        return Response.json(
            {
                user: { id: user.id, email: user.email, phone: user.phone, name: user.name },
                session,
                isNewUser: !user,
            },
            { headers: { "Set-Cookie": cookie } }
        )
    }
}