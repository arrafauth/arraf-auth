import type { OTPConfig, SMSProvider, DatabaseAdapter, VerificationType } from "./types"

export function generateOTP(length: number = 6): string {
    const min = Math.pow(10, length - 1)
    const max = Math.pow(10, length) - 1
    const range = max - min + 1
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    return String(min + (randomBuffer[0] % range))
}

export async function sendOTP(params: {
    identifier: string
    type: VerificationType
    adapter: DatabaseAdapter
    smsProvider?: SMSProvider
    config?: OTPConfig
    appName?: string
}): Promise<{ success: boolean; error?: string }> {
    const { identifier, type, adapter, smsProvider, config, appName } = params

    const otp = generateOTP(config?.length ?? 6)
    const expiresAt = new Date(Date.now() + (config?.expiresIn ?? 300) * 1000)

    const existing = await adapter.findVerification(identifier, type)
    if (existing) await adapter.deleteVerification(existing.id)

    await adapter.createVerification({
        identifier,
        token: otp,
        type,
        expiresAt,
        attempts: 0,
    })

    if (
        (type === "phone-otp" || type === "forgot-password-phone") &&
        smsProvider
    ) {
        const result = await smsProvider.send({ to: identifier, otp })
        if (!result.success) {
            return { success: false, error: result.error ?? "SMS sending failed" }
        }
    }

    return { success: true }
}

export async function verifyOTP(params: {
    identifier: string
    otp: string
    type: VerificationType
    adapter: DatabaseAdapter
    maxAttempts?: number
}): Promise<{ valid: boolean; error?: string }> {
    const { identifier, otp, type, adapter, maxAttempts = 5 } = params

    const verification = await adapter.findVerification(identifier, type)

    if (!verification) {
        return { valid: false, error: "No OTP found. Please request a new one." }
    }

    if (verification.expiresAt < new Date()) {
        await adapter.deleteVerification(verification.id)
        return { valid: false, error: "OTP expired. Please request a new one." }
    }

    if (verification.attempts >= maxAttempts) {
        await adapter.deleteVerification(verification.id)
        return { valid: false, error: "Too many attempts. Please request a new OTP." }
    }

    if (verification.token !== otp) {
        await adapter.updateVerification(verification.id, {
            attempts: verification.attempts + 1,
        })
        const remaining = maxAttempts - verification.attempts - 1
        return { valid: false, error: `Invalid OTP. ${remaining} attempts remaining.` }
    }

    await adapter.deleteVerification(verification.id)
    return { valid: true }
}