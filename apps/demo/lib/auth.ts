import { createAuth } from "@arraf-auth/core"
import { prismaAdapter } from "@arraf-auth/adapter-prisma"
import { prisma } from "./prisma"

export const auth = createAuth({
    secret: process.env.AUTH_SECRET!,
    database: prismaAdapter(prisma),

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
        send: async ({ to, message }) => {
            console.log("─────────────────────────────")
            console.log(`📱 SMS to: ${to}`)
            console.log(`💬 Message: ${message}`)
            console.log("─────────────────────────────")
            return { success: true }
        },
    },
})