import { createAuth } from "@arraf-auth/core"
import { prismaAdapter } from "@arraf-auth/adapter-prisma"
import { google } from "@arraf-auth/provider-google"
import { github } from "@arraf-auth/provider-github"
import { prisma } from "./prisma"

export const auth = createAuth({
    secret: process.env.AUTH_SECRET!,
    database: prismaAdapter(prisma),

    session: {
        strategy: "database",
        cookieName: "arraf_session",
        expiresIn: "30d",
    },

    otp: {
        length: 6,
        expiresIn: 300,
        maxAttempts: 5,
        messageTemplate: (otp) =>
            `رمز التحقق الخاص بك: ${otp}\nYour verification code: ${otp}\nValid for 5 minutes.`,
    },

    sms: {
        send: async ({ to, message }) => {
            // Demo uses console log — developer replaces with real provider
            console.log(`[SMS to ${to}]: ${message}`)
            return { success: true }
        },
    },

    providers: [
        google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            redirectUri: `${process.env.NEXT_PUBLIC_URL}/auth/callback/google`,
        }),
        github({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            redirectUri: `${process.env.NEXT_PUBLIC_URL}/auth/callback/github`,
        }),
    ],
})