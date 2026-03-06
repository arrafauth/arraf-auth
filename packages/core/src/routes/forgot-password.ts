import { z } from "zod"
import type { AuthContext } from "../auth"
import { normalizePhone } from "../phone"
import { generateOTP } from "../otp"
import { nanoid } from "nanoid"
import { localizeError, t } from "./i18n"

const forgotPasswordSchema = z.discriminatedUnion("method", [
    z.object({
        method: z.literal("email"),
        email: z.string().email(),
        mode: z.enum(["otp", "link"]).default("otp"),
    }),
    z.object({
        method: z.literal("phone"),
        phone: z.string(),
    }),
])

export function createForgotPasswordRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = forgotPasswordSchema.safeParse(body)

        if (!parsed.success) {
            return Response.json({ error: t("Invalid input", "مدخلات غير صالحة") }, { status: 400 })
        }

        if (parsed.data.method === "phone") {
            const normalized = normalizePhone(parsed.data.phone)
            if (!normalized.valid || !normalized.normalized) {
                return Response.json({ error: localizeError(normalized.error) }, { status: 400 })
            }

            const phone = normalized.normalized
            const user = await ctx.adapter.findUserByPhone(phone)

            if (!user) return Response.json({ success: true })

            const account = await ctx.adapter.findAccount("credential", user.id)
            if (!account) {
                return Response.json(
                    {
                        error: localizeError("This account uses OTP sign-in. No password to reset."),
                    },
                    { status: 400 }
                )
            }

            const otp = generateOTP(ctx.config.otp?.length ?? 6)
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

            const existing = await ctx.adapter.findVerification(phone, "forgot-password-phone")
            if (existing) await ctx.adapter.deleteVerification(existing.id)

            await ctx.adapter.createVerification({
                identifier: phone,
                token: otp,
                type: "forgot-password-phone",
                expiresAt,
                attempts: 0,
            })

            if (ctx.config.callbacks?.onForgotPassword) {
                await ctx.config.callbacks.onForgotPassword({
                    user,
                    identifier: phone,
                    method: "phone",
                    otp,
                    expiresAt,
                })
            }

            return Response.json({
                success: true,
                method: "phone",
                maskedPhone: phone.slice(0, 5) + "****" + phone.slice(-4),
            })
        }

        const { email, mode } = parsed.data
        const user = await ctx.adapter.findUserByEmail(email)

        if (!user) return Response.json({ success: true })

        const account = await ctx.adapter.findAccount("credential", user.id)
        if (!account) {
            return Response.json(
                { error: localizeError("This account uses social sign-in. No password to reset.") },
                { status: 400 }
            )
        }

        const existing = await ctx.adapter.findVerification(email, "forgot-password-email")
        if (existing) await ctx.adapter.deleteVerification(existing.id)

        let otp: string | undefined
        let token: string | undefined
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

        if (mode === "otp") {
            otp = generateOTP(ctx.config.otp?.length ?? 6)

            await ctx.adapter.createVerification({
                identifier: email,
                token: otp,
                type: "forgot-password-email",
                expiresAt,
                attempts: 0,
            })
        } else {
            token = nanoid(64)

            await ctx.adapter.createVerification({
                identifier: email,
                token,
                type: "forgot-password-email",
                expiresAt,
                attempts: 0,
            })
        }

        if (ctx.config.callbacks?.onForgotPassword) {
            await ctx.config.callbacks.onForgotPassword({
                user,
                identifier: email,
                method: "email",
                otp,
                token,
                expiresAt,
            })
        }

        return Response.json({ success: true, method: "email", mode })
    }
}
