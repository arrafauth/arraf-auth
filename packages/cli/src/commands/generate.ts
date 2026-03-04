import path from "path"
import fs from "fs-extra"
import { detectConfig, detectAdapter } from "../utils/detect"
import { generatePrismaSchema } from "../generators/prisma"
import { generateDrizzleSchema } from "../generators/drizzle"

const RTL_EMBED = '\u202B'
const POP_DIR = '\u202C'

const en = (text: string) => `🇺🇸 ${text}`
const ar = (text: string) => `🇸🇦 ${RTL_EMBED}${text}${POP_DIR}`

function showBilingualMessage(enText: string, arText: string, emoji: string = "📌") {
    const maxLen = Math.max(enText.length, arText.length) + 10
    console.log(`
┌${'─'.repeat(maxLen)}┐
│ ${emoji} ${enText.padEnd(maxLen - 6)} │
│ ${emoji} ${arText.padStart(maxLen - 6)} │
└${'─'.repeat(maxLen)}┘
    `)
}

export async function generate(options: { cwd?: string } = {}) {
    const cwd = options.cwd ?? process.cwd()

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🔧 arraf-auth — Schema Generator                           ║
║  🔧 عرّاف-أوث — مولد مخطط قاعدة البيانات                     ║
╚══════════════════════════════════════════════════════════════╝
    `)

    console.log("📖 " + en("Reading your configuration..."))
    console.log("📖 " + ar("جاري قراءة الإعدادات..."))
    console.log("")

    let config = await detectConfig(cwd)

    if (!config.adapter) {
        console.log("⚠️  " + en("No arraf-auth.config.json found — auto-detecting adapter..."))
        console.log("⚠️  " + ar("لم يتم العثور على ملف الإعدادات — جاري اكتشاف محول البيانات تلقائيًا..."))
        console.log("")
        config.adapter = await detectAdapter(cwd)
    }

    if (!config.adapter) {
        console.log("❌ " + en("Could not detect adapter. Create an arraf-auth.config.json file at your project root."))
        console.log("❌ " + ar("تعذر اكتشاف محول البيانات. الرجاء إنشاء ملف الإعدادات في المجلد الرئيسي للمشروع."))
        console.log("")
        console.log("📋 " + en("Example arraf-auth.config.json:"))
        console.log("📋 " + ar("مثال على ملف الإعدادات:"))
        console.log(`
  {
    "adapter": "prisma",
    "features": {
      "emailVerification": true,
      "phoneOtp": true,
      "forgotPassword": true,
      "oauth": true
    },
  }
    `)
        process.exit(1)
    }

    console.log("─".repeat(60))
    console.log(`🔌 ${en("Adapter:")} ${config.adapter}`)
    console.log(`🔌 ${ar("محول البيانات:")} ${config.adapter === "prisma" ? "بريسما" : "دريزّل"}`)

    const features = Object.entries(config.features)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", ")

    const arFeatures = Object.entries(config.features)
        .filter(([, v]) => v)
        .map(([k]) => {
            const featureMap: Record<string, string> = {
                emailVerification: "تفعيل البريد الإلكتروني",
                phoneOtp: "رمز التحقق للجوال",
                forgotPassword: "استعادة كلمة المرور",
                oauth: "الدخول الموحد"
            }
            return featureMap[k] || k
        }).join("، ")

    console.log(`⚙️  ${en("Features:")} ${features}`)
    console.log(`⚙️  ${ar("الخصائص المفعلة:")} ${arFeatures}`)
    console.log("─".repeat(60))

    if (config.adapter === "prisma") {
        await generatePrismaFile(cwd, config)
    } else if (config.adapter === "drizzle") {
        await generateDrizzleFile(cwd, config)
    }
}

async function generatePrismaFile(
    cwd: string,
    config: Awaited<ReturnType<typeof detectConfig>>
) {
    const outputDir = path.join(cwd, "prisma")
    const outputFile = path.join(outputDir, "schema.prisma")

    await fs.ensureDir(outputDir)

    if (await fs.pathExists(outputFile)) {
        const backup = path.join(outputDir, `schema.prisma.backup`)
        await fs.copy(outputFile, backup)
        console.log("💾 " + en(`Existing schema backed up to: prisma/schema.prisma.backup`))
        console.log("💾 " + ar(`تم إنشاء نسخة احتياطية من المخطط الحالي في: prisma/schema.prisma.backup`))
        console.log("")
    }

    const schema = generatePrismaSchema(config)
    await fs.writeFile(outputFile, schema, "utf-8")

    console.log("─".repeat(60))
    console.log("✅ " + en("Schema generated successfully!"))
    console.log("✅ " + ar("تم إنشاء مخطط قاعدة البيانات بنجاح!"))
    console.log(`📄 ${en("File:")} prisma/schema.prisma`)
    console.log(`📄 ${ar("الملف:")} prisma/schema.prisma`)
    console.log("─".repeat(60))

    console.log("📋 " + en("Next steps:"))
    console.log("📋 " + ar("الخطوات التالية:"))
    console.log("  1. " + en("Review the generated schema"))
    console.log("  ١. " + ar("مراجعة المخطط المُنشأ"))
    console.log(`  2. ${pc("npx arraf-auth migrate")} ` + en("to apply to your database"))
    console.log(`  ٢. ${pc("npx arraf-auth migrate")} ` + ar("لتطبيق التغييرات على قاعدة البيانات"))
    console.log("  3. " + en("Or run manually: npx prisma migrate dev"))
    console.log("  ٣. " + ar("أو التشغيل يدويًا: npx prisma migrate dev"))
}

async function generateDrizzleFile(
    cwd: string,
    config: Awaited<ReturnType<typeof detectConfig>>
) {
    const drizzleConfigTs = path.join(cwd, "drizzle.config.ts")
    const drizzleConfigJs = path.join(cwd, "drizzle.config.js")

    let outputDir = path.join(cwd, "src", "db")
    let outputFile = path.join(outputDir, "auth-schema.ts")

    if (await fs.pathExists(drizzleConfigTs) || await fs.pathExists(drizzleConfigJs)) {
        console.log("📁 " + en("Found drizzle.config — using src/db/ as schema location"))
        console.log("📁 " + ar("تم العثور على ملف إعدادات دريزّل — استخدام المجلد src/db/ لحفظ المخطط"))
        console.log("")
    }

    await fs.ensureDir(outputDir)

    if (await fs.pathExists(outputFile)) {
        const backup = outputFile.replace(".ts", ".backup.ts")
        await fs.copy(outputFile, backup)
        console.log("💾 " + en(`Existing schema backed up to: src/db/auth-schema.backup.ts`))
        console.log("💾 " + ar(`تم إنشاء نسخة احتياطية من المخطط الحالي في: src/db/auth-schema.backup.ts`))
        console.log("")
    }

    const schema = generateDrizzleSchema(config)
    await fs.writeFile(outputFile, schema, "utf-8")

    if (
        !(await fs.pathExists(drizzleConfigTs)) &&
        !(await fs.pathExists(drizzleConfigJs))
    ) {
        const drizzleConfig = `import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/auth-schema.ts",
  out:    "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
`
        await fs.writeFile(drizzleConfigTs, drizzleConfig, "utf-8")
        console.log("✅ " + en("drizzle.config.ts created!"))
        console.log("✅ " + ar("تم إنشاء ملف إعدادات دريزّل بنجاح!"))
        console.log(`📄 ${en("File:")} drizzle.config.ts`)
        console.log(`📄 ${ar("الملف:")} drizzle.config.ts`)
        console.log("")
    }

    console.log("─".repeat(60))
    console.log("✅ " + en("Schema generated successfully!"))
    console.log("✅ " + ar("تم إنشاء مخطط قاعدة البيانات بنجاح!"))
    console.log(`📄 ${en("File:")} src/db/auth-schema.ts`)
    console.log(`📄 ${ar("الملف:")} src/db/auth-schema.ts`)
    console.log("─".repeat(60))

    console.log("📋 " + en("Next steps:"))
    console.log("📋 " + ar("الخطوات التالية:"))
    console.log("  1. " + en("Review the generated schema"))
    console.log("  ١. " + ar("مراجعة المخطط المُنشأ"))
    console.log(`  2. ${pc("npx arraf-auth migrate")} ` + en("to apply to your database"))
    console.log(`  ٢. ${pc("npx arraf-auth migrate")} ` + ar("لتطبيق التغييرات على قاعدة البيانات"))
    console.log("  3. " + en("Or run manually: npx drizzle-kit push"))
    console.log("  ٣. " + ar("أو التشغيل يدويًا: npx drizzle-kit push"))
}

function pc(text: string): string {
    return `\x1b[36m${text}\x1b[0m`
}