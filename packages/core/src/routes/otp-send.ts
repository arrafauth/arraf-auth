import { z } from "zod"
import type { AuthContext } from "../auth"
import { normalizePhone } from "../phone"
import { sendOTP } from "../otp"

const sendOTPSchema = z.discriminatedUnion("method", [
    z.object({
        method: z.literal("phone"),
        phone: z.string(),
    }),
    z.object({
        method: z.literal("email"),
        email: z.string().email(),
    }),
])

export function createSendOTPRoute(ctx: AuthContext) {
    return async (req: Request): Promise<Response> => {
        const body = await req.json()
        const parsed = sendOTPSchema.safeParse(body)

        if (!parsed.success) {
            return Response.json({ error: "Invalid input" }, { status: 400 })
        }

        if (parsed.data.method === "phone") {
            const result = normalizePhone(parsed.data.phone)
            if (!result.valid || !result.normalized) {
                return Response.json({ error: result.error }, { status: 400 })
            }

            if (!ctx.config.sms) {
                return Response.json(
                    { error: "SMS provider not configured" },
                    { status: 500 }
                )
            }

            const sent = await sendOTP({
                identifier: result.normalized,
                type: "phone-otp",
                adapter: ctx.adapter,
                smsProvider: ctx.config.sms,
                config: ctx.config.otp,
            })

            if (!sent.success) {
                return Response.json({ error: sent.error }, { status: 500 })
            }

            return Response.json({
                success: true,
                message: "OTP sent to phone",
                maskedPhone: maskPhone(result.normalized),
            })
        }

        return Response.json({ error: "Email OTP not yet configured" }, { status: 501 })
    }
}

function maskPhone(phone: string): string {
    return phone.slice(0, 5) + "****" + phone.slice(-4)
}