import { z } from "zod"
import type { AuthContext } from "../auth"
import { normalizePhone } from "../phone"
import { hashPassword } from "../password"
import { localizeError, t } from "./i18n"

const resetPasswordSchema = z.discriminatedUnion("method", [
    z.object({
        method: z.literal("email"),
        email: z.string().email(),
        otp: z.string().optional(),
        token: z.string().optional(),
        newPassword: z.string().min(8),
    }).refine(
        (d) => d.otp || d.token,
        { message: "Either otp or token is required" }
    ),
    z.object({
        method: z.literal("phone"),
        phone: z.string(),
        otp: z.string().length(6),
        newPassword: z.string().min(8),
    }),
])

export function createResetPasswordRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = resetPasswordSchema.safeParse(body)

        if (!parsed.success) {
            return Response.json(
                { error: t("Invalid input", "مدخلات غير صالحة"), details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        if (parsed.data.method === "phone") {
            const normalized = normalizePhone(parsed.data.phone)
            if (!normalized.valid || !normalized.normalized) {
                return Response.json({ error: localizeError(normalized.error) }, { status: 400 })
            }

            const phone = normalized.normalized

            const verification = await ctx.adapter.findVerification(phone, "forgot-password-phone")

            if (!verification) {
                return Response.json(
                    { error: localizeError("No reset request found. Please request a new code.") },
                    { status: 401 }
                )
            }

            if (verification.expiresAt < new Date()) {
                await ctx.adapter.deleteVerification(verification.id)
                return Response.json({ error: localizeError("Code expired.") }, { status: 401 })
            }

            const maxAttempts = ctx.config.otp?.maxAttempts ?? 5

            if (verification.attempts >= maxAttempts) {
                await ctx.adapter.deleteVerification(verification.id)
                return Response.json(
                    { error: localizeError("Too many attempts. Request a new code.") },
                    { status: 401 }
                )
            }

            if (verification.token !== parsed.data.otp) {
                await ctx.adapter.updateVerification(verification.id, {
                    attempts: verification.attempts + 1,
                })
                const remaining = maxAttempts - verification.attempts - 1
                return Response.json(
                    { error: localizeError(`Invalid code. ${remaining} attempts remaining.`) },
                    { status: 401 }
                )
            }

            await ctx.adapter.deleteVerification(verification.id)

            const user = await ctx.adapter.findUserByPhone(phone)
            if (!user) {
                return Response.json({ error: localizeError("User not found") }, { status: 404 })
            }

            const newHash = await hashPassword(parsed.data.newPassword)
            const account = await ctx.adapter.findAccount("credential", user.id)

            if (!account) {
                await ctx.adapter.createAccount({
                    userId: user.id,
                    providerId: "credential",
                    accountId: user.id,
                    accessToken: newHash,
                })
            } else {
                await ctx.adapter.updateAccount(account.id, { accessToken: newHash })
            }

            await ctx.adapter.deleteUserSessions(user.id)

            if (ctx.config.callbacks?.onPasswordChanged) {
                await ctx.config.callbacks.onPasswordChanged({ user })
            }

            return Response.json({ success: true })
        }

        const { email, newPassword } = parsed.data

        const verification = await ctx.adapter.findVerification(email, "forgot-password-email")

        if (!verification) {
            return Response.json(
                { error: localizeError("No reset request found. Please request a new one.") },
                { status: 401 }
            )
        }

        if (verification.expiresAt < new Date()) {
            await ctx.adapter.deleteVerification(verification.id)
            return Response.json({ error: localizeError("Reset request expired.") }, { status: 401 })
        }

        if (parsed.data.otp) {
            const maxAttempts = ctx.config.otp?.maxAttempts ?? 5

            if (verification.attempts >= maxAttempts) {
                await ctx.adapter.deleteVerification(verification.id)
                return Response.json(
                    { error: localizeError("Too many attempts. Request a new code.") },
                    { status: 401 }
                )
            }

            if (verification.token !== parsed.data.otp) {
                await ctx.adapter.updateVerification(verification.id, {
                    attempts: verification.attempts + 1,
                })
                const remaining = maxAttempts - verification.attempts - 1
                return Response.json(
                    { error: localizeError(`Invalid code. ${remaining} attempts remaining.`) },
                    { status: 401 }
                )
            }
        }

        if (parsed.data.token) {
            if (verification.token !== parsed.data.token) {
                return Response.json({ error: localizeError("Invalid reset token") }, { status: 401 })
            }
        }

        await ctx.adapter.deleteVerification(verification.id)

        const user = await ctx.adapter.findUserByEmail(email)
        if (!user) {
            return Response.json({ error: localizeError("User not found") }, { status: 404 })
        }

        const newHash = await hashPassword(newPassword)
        const account = await ctx.adapter.findAccount("credential", user.id)

        if (!account) {
            await ctx.adapter.createAccount({
                userId: user.id,
                providerId: "credential",
                accountId: user.id,
                accessToken: newHash,
            })
        } else {
            await ctx.adapter.updateAccount(account.id, { accessToken: newHash })
        }

        await ctx.adapter.deleteUserSessions(user.id)

        if (ctx.config.callbacks?.onPasswordChanged) {
            await ctx.config.callbacks.onPasswordChanged({ user })
        }

        return Response.json({ success: true })
    }
}
