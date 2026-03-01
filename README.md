<p align="center">
  <img src="./banner.png" alt="arraf-auth" />
</p>

# arraf-auth

TypeScript-first authentication library built for the Saudi Arabia market.
Supports email/password, phone + OTP, and OAuth — out of the box.

## Packages

| Package | Description |
|---|---|
| `@arraf-auth/core` | Framework-agnostic auth engine |
| `@arraf-auth/adapter-prisma` | Prisma database adapter |
| `@arraf-auth/adapter-drizzle` | Drizzle database adapter |
| `@arraf-auth/provider-google` | Google OAuth provider |
| `@arraf-auth/provider-github` | GitHub OAuth provider |
| `@arraf-auth/provider-twitter` | Twitter/X OAuth provider |
| `@arraf-auth/nextjs` | Next.js integration |
| `@arraf-auth/express` | Express integration |
| `@arraf-auth/hono` | Hono integration |

## Quick Start
```bash
pnpm add @arraf-auth/core @arraf-auth/adapter-prisma
```
```ts
import { createAuth } from "@arraf-auth/core"
import { prismaAdapter } from "@arraf-auth/adapter-prisma"

export const auth = createAuth({
  secret: process.env.AUTH_SECRET!,
  database: prismaAdapter(prisma),
  sms: {
    send: async ({ to, message }) => {
      // plug in Unifonic, Taqnyat, Msegat, etc.
      return { success: true }
    }
  }
})
```

## Auth Flows

Phone + OTP (primary for Saudi market):
POST /auth/otp/send   { method: "phone", phone: "0501234567" }
POST /auth/otp/verify { method: "phone", phone: "0501234567", otp: "123456" }

Email + Password:
POST /auth/sign-up { email, password, name }
POST /auth/sign-in { method: "email", email, password }

OAuth:
GET /auth/sign-in/google
GET /auth/sign-in/github
GET /auth/sign-in/twitter

## License
MIT