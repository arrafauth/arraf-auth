import { z } from "zod"
import type { AuthContext } from "../auth"
import { generateOTP, verifyOTP } from "../otp"
import { nanoid } from "nanoid"

const sendVerifySchema = z.object({
    email: z.string().email(),
    mode: z.enum(["otp", "link"]).default("otp"),
})

export function createSendVerifyEmailRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = sendVerifySchema.safeParse(body)

        if (!parsed.success) {
            return Response.json({ error: "Invalid input" }, { status: 400 })
        }

        const { email, mode } = parsed.data

        const user = await ctx.adapter.findUserByEmail(email)
        if (!user) {
            return Response.json({ success: true })
        }

        if (user.emailVerified) {
            return Response.json({ error: "Email already verified" }, { status: 400 })
        }

        const existing = await ctx.adapter.findVerification(email, "email-verification")
        if (existing) await ctx.adapter.deleteVerification(existing.id)

        let otp: string | undefined
        let token: string | undefined
        let expiresAt: Date

        if (mode === "otp") {
            otp = generateOTP(ctx.config.otp?.length ?? 6)
            expiresAt = new Date(Date.now() + 10 * 60 * 1000)

            await ctx.adapter.createVerification({
                identifier: email,
                token: otp,
                type: "email-verification",
                expiresAt,
                attempts: 0,
            })
        } else {
            token = nanoid(64)
            expiresAt = new Date(Date.now() + 60 * 60 * 1000)

            await ctx.adapter.createVerification({
                identifier: email,
                token,
                type: "email-verification",
                expiresAt,
                attempts: 0,
            })
        }

        if (ctx.config.callbacks?.onVerifyEmail) {
            await ctx.config.callbacks.onVerifyEmail({
                user,
                email,
                otp,
                token,
                expiresAt,
            })
        }

        return Response.json({ success: true, mode })
    }
}

const confirmVerifySchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("otp"),
        email: z.string().email(),
        otp: z.string().length(6),
    }),
    z.object({
        mode: z.literal("link"),
        email: z.string().email(),
        token: z.string(),
    }),
])

export function createConfirmVerifyEmailRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = confirmVerifySchema.safeParse(body)

        if (!parsed.success) {
            return Response.json({ error: "Invalid input" }, { status: 400 })
        }

        const { email, mode } = parsed.data

        const user = await ctx.adapter.findUserByEmail(email)
        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 })
        }

        if (user.emailVerified) {
            return Response.json({ error: "Already verified" }, { status: 400 })
        }

        if (mode === "otp") {
            const result = await verifyOTP({
                identifier: email,
                otp: parsed.data.otp,
                type: "email-verification",
                adapter: ctx.adapter,
                maxAttempts: ctx.config.otp?.maxAttempts ?? 5,
            })

            if (!result.valid) {
                return Response.json({ error: result.error }, { status: 401 })
            }
        } else {
            const verification = await ctx.adapter.findVerification(email, "email-verification")

            if (!verification) {
                return Response.json({ error: "Invalid or expired token" }, { status: 401 })
            }

            if (verification.expiresAt < new Date()) {
                await ctx.adapter.deleteVerification(verification.id)
                return Response.json({ error: "Token expired" }, { status: 401 })
            }

            if (verification.token !== parsed.data.token) {
                return Response.json({ error: "Invalid token" }, { status: 401 })
            }

            await ctx.adapter.deleteVerification(verification.id)
        }

        await ctx.adapter.updateUser(user.id, { emailVerified: true })

        for (const plugin of ctx.plugins) {
            await plugin.hooks?.afterOTPVerified?.(user, "email-verification")
        }

        return Response.json({ success: true })
    }
}