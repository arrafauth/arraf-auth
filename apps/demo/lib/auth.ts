import { createAuth } from "@arraf-auth/core"
import { prismaAdapter } from "@arraf-auth/adapter-prisma"
import { prisma } from "./prisma"

export const auth = createAuth({
    secret: process.env.AUTH_SECRET!,
    database: prismaAdapter(prisma),
    appName: "Demo App",
    appUrl: "http://localhost:3000",

    session: {
        strategy: "database",
        cookieName: "arraf_session",
    },

    otp: {
        length: 6,
        expiresIn: 300,
        maxAttempts: 5,
    },

    sms: {
        send: async ({ to, otp }) => {
            const message = `رمز التحقق: ${otp}\nYour verification code: ${otp}\nValid for 5 minutes.`
            console.log("─────────────────────────────")
            console.log(`📱 SMS to: ${to}`)
            console.log(`💬 Message: ${message}`)
            console.log("─────────────────────────────")
            return { success: true }
        },
    },

    callbacks: {
        onVerifyEmail: async ({ user, email, otp, token, expiresAt }) => {
            if (otp) {
                console.log("─────────────────────────────")
                console.log(`📧 Verify Email to: ${email}`)
                console.log(`🔑 OTP: ${otp}`)
                console.log(`⏰ Expires: ${expiresAt}`)
                console.log("─────────────────────────────")
            }
            if (token) {
                const link = `${process.env.NEXT_PUBLIC_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
                console.log("─────────────────────────────")
                console.log(`📧 Verify Email to: ${email}`)
                console.log(`🔗 Link: ${link}`)
                console.log(`⏰ Expires: ${expiresAt}`)
                console.log("─────────────────────────────")
            }
        },

        onForgotPassword: async ({ user, identifier, method, otp, token, expiresAt }) => {
            if (method === "phone" && otp) {
                const message = `رمز إعادة تعيين كلمة المرور: ${otp}\nPassword reset code: ${otp}\nValid for 15 minutes.`
                console.log("─────────────────────────────")
                console.log(`📱 Forgot Password SMS to: ${identifier}`)
                console.log(`💬 Message: ${message}`)
                console.log(`⏰ Expires: ${expiresAt}`)
                console.log("─────────────────────────────")
            }
            if (method === "email" && otp) {
                console.log("─────────────────────────────")
                console.log(`📧 Forgot Password Email to: ${identifier}`)
                console.log(`🔑 OTP: ${otp}`)
                console.log(`⏰ Expires: ${expiresAt}`)
                console.log("─────────────────────────────")
            }
            if (method === "email" && token) {
                const link = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}&email=${encodeURIComponent(identifier)}`
                console.log("─────────────────────────────")
                console.log(`📧 Forgot Password Email to: ${identifier}`)
                console.log(`🔗 Link: ${link}`)
                console.log(`⏰ Expires: ${expiresAt}`)
                console.log("─────────────────────────────")
            }
        },

        onPasswordChanged: async ({ user }) => {
            console.log("─────────────────────────────")
            console.log(`🔐 Password changed for user: ${user.email ?? user.phone}`)
            console.log("─────────────────────────────")
        },
    },
})