<p align="center">
  <img src="./banner.png" alt="arraf-auth" />
</p>

# arraf-auth

TypeScript-first authentication library built for the Saudi Arabia market. | مكتبة مصادقة مبنية أولًا بـ TypeScript وموجهة للسوق السعودي.
Supports email/password, phone OTP, and OAuth with framework adapters for Next.js, Express, and Hono. | تدعم البريد/كلمة المرور، ورمز التحقق للهاتف (OTP)، وOAuth مع تكاملات Next.js وExpress وHono.

## Monorepo Packages | حزم المشروع

| Package | Description |
|---|---|
| `@arraf-auth/core` | Framework-agnostic auth engine \| محرك مصادقة مستقل عن الإطار |
| `@arraf-auth/adapter-prisma` | Prisma database adapter \| محول قاعدة بيانات Prisma |
| `@arraf-auth/adapter-drizzle` | Drizzle ORM database adapter \| محول قاعدة بيانات Drizzle ORM |
| `@arraf-auth/provider-google` | Google OAuth provider \| مزود Google OAuth |
| `@arraf-auth/provider-github` | GitHub OAuth provider \| مزود GitHub OAuth |
| `@arraf-auth/nextjs` | Next.js integration (`toNextHandlers`, client hooks, middleware) \| تكامل Next.js |
| `@arraf-auth/express` | Express integration middleware \| وسيط تكامل Express |
| `@arraf-auth/hono` | Hono integration middleware \| وسيط تكامل Hono |
| `@arraf-auth/cli` | CLI for schema generation, migration, and secret generation \| أداة سطر أوامر لإنشاء المخطط والترحيل وتوليد السر |

## Core Features | الميزات الأساسية

- Email + password sign-up/sign-in | التسجيل/الدخول بالبريد وكلمة المرور
- Phone sign-in with OTP | تسجيل الدخول بالهاتف عبر OTP
- OAuth sign-in (Google/GitHub) | تسجيل الدخول عبر OAuth (Google/GitHub)
- Session management (database or JWT strategy) | إدارة الجلسات (قاعدة بيانات أو JWT)
- Plugin hooks + custom plugin routes | نقاط ربط للإضافات + مسارات مخصصة
- Auth callbacks | ردود نداءات المصادقة:
  - `onVerifyEmail`
  - `onForgotPassword`
  - `onPasswordChanged`
- Localized API error/message payloads in `en` and `ar` for route responses | استجابات أخطاء/رسائل API مترجمة بالإنجليزية والعربية

## Install | التثبيت

```bash
pnpm add @arraf-auth/core @arraf-auth/adapter-prisma
```

Optional packages | حزم اختيارية:

```bash
pnpm add @arraf-auth/provider-google @arraf-auth/provider-github
pnpm add @arraf-auth/nextjs
pnpm add @arraf-auth/express
pnpm add @arraf-auth/hono
pnpm add -D @arraf-auth/cli
```

## Quick Start (Core + Prisma) | بداية سريعة

```ts
import { createAuth } from "@arraf-auth/core"
import { prismaAdapter } from "@arraf-auth/adapter-prisma"

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
    send: async ({ to, otp }) => {
      // Plug your SMS provider (Unifonic / Taqnyat / etc.)
      return { success: true }
    },
  },
})
```

## Next.js Usage | استخدام Next.js

```ts
// app/api/auth/[...all]/route.ts
import { toNextHandlers } from "@arraf-auth/nextjs"
import { auth } from "@/lib/auth"

export const { GET, POST } = toNextHandlers(auth)
```

```tsx
// app/providers.tsx
"use client"

import { AuthProvider } from "@arraf-auth/nextjs/client"

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider basePath="/api/auth">{children}</AuthProvider>
}
```

## Mounted Routes (from `createAuth`) | المسارات المركبة

Base path is `/auth` (or `/api/auth` when remapped by Next.js integration). | المسار الأساسي هو `/auth` (أو `/api/auth` مع تكامل Next.js).

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/sign-out`
- `GET /auth/session`
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `GET /auth/sign-in/:provider` (only when OAuth providers are configured) | فقط عند إعداد مزودي OAuth
- `GET /auth/callback/:provider` (only when OAuth providers are configured) | فقط عند إعداد مزودي OAuth

## Localized Response Shape | شكل الاستجابة المترجمة

Route errors/messages return localized payloads. | أخطاء/رسائل المسارات ترجع بصيغة مترجمة.

```json
{
  "error": {
    "en": "Invalid input",
    "ar": "مدخلات غير صالحة"
  }
}
```

Example from phone sign-in flow | مثال من تدفق تسجيل الدخول بالهاتف:

```json
{
  "nextStep": "otp",
  "message": {
    "en": "Please verify your phone number with OTP",
    "ar": "يرجى التحقق من رقم الهاتف باستخدام OTP"
  }
}
```

## CLI | سطر الأوامر

`@arraf-auth/cli` provides | يوفّر:

- `arraf-auth generate` (generate schema files for Prisma/Drizzle) | إنشاء ملفات المخطط
- `arraf-auth migrate` (apply generated schema) | تطبيق الترحيلات
- `arraf-auth secret` (generate `AUTH_SECRET`) | توليد `AUTH_SECRET`

Example | مثال:

```bash
npx arraf-auth generate
npx arraf-auth migrate --name init_auth
npx arraf-auth secret
```

Optional `arraf-auth.config.json` | ملف إعداد اختياري:

```json
{
  "adapter": "prisma",
  "features": {
    "emailVerification": true,
    "phoneOtp": true,
    "forgotPassword": true,
    "oauth": true
  }
}
```

## Development | التطوير

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

## License | الترخيص

MIT
