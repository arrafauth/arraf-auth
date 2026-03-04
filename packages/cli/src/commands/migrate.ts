import { execSync } from "child_process"
import path from "path"
import fs from "fs-extra"
import { detectConfig, detectAdapter } from "../utils/detect"

const RTL_EMBED = '\u202B'
const POP_DIR = '\u202C'

const en = (text: string) => `🇺🇸 ${text}`
const ar = (text: string) => `🇸🇦 ${RTL_EMBED}${text}${POP_DIR}`

export async function migrate(
    options: { cwd?: string; name?: string } = {}
) {
    const cwd = options.cwd ?? process.cwd()
    const name = options.name ?? "arraf_auth_migration"

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🔄 arraf-auth — Database Migration                         ║
║  🔄 عرّاف-أوث — ترحيل قاعدة البيانات                         ║
╚══════════════════════════════════════════════════════════════╝
    `)

    let config = await detectConfig(cwd)
    if (!config.adapter) {
        config.adapter = await detectAdapter(cwd)
    }

    if (!config.adapter) {
        console.log("❌ " + en("Could not detect adapter. Run: npx arraf-auth generate first."))
        console.log("❌ " + ar("تعذر اكتشاف محول البيانات. الرجاء تشغيل الأمر أولاً: npx arraf-auth generate"))
        console.log("")
        process.exit(1)
    }

    console.log("─".repeat(60))
    console.log(`🔌 ${en("Adapter:")} ${config.adapter}`)
    console.log(`🔌 ${ar("محول البيانات:")} ${config.adapter === "prisma" ? "بريسما" : "دريزّل"}`)
    console.log("─".repeat(60))

    if (config.adapter === "prisma") {
        await migratePrisma(cwd, name)
    } else if (config.adapter === "drizzle") {
        await migrateDrizzle(cwd)
    }
}

async function migratePrisma(cwd: string, name: string) {
    const schemaPath = path.join(cwd, "prisma", "schema.prisma")

    if (!(await fs.pathExists(schemaPath))) {
        console.log("❌ " + en("prisma/schema.prisma not found. Run: npx arraf-auth generate first."))
        console.log("❌ " + ar("لم يتم العثور على ملف المخطط. الرجاء تشغيل الأمر أولاً: npx arraf-auth generate"))
        console.log("")
        process.exit(1)
    }

    console.log("🔄 " + en("Running Prisma migration..."))
    console.log("🔄 " + ar("جاري تشغيل ترحيل بريسما..."))
    console.log("")

    try {
        execSync("npx prisma --version", { stdio: "ignore", cwd })
    } catch {
        console.log("❌ " + en("Prisma CLI not found. Run: pnpm add -D prisma"))
        console.log("❌ " + ar("لم يتم العثور على واجهة بريسما. الرجاء تشغيل: pnpm add -D prisma"))
        console.log("")
        process.exit(1)
    }

    try {
        console.log("⚙️  " + en("Generating Prisma client..."))
        console.log("⚙️  " + ar("جاري إنشاء عميل بريسما..."))
        execSync("npx prisma generate", { stdio: "inherit", cwd })
        console.log("✅ " + en("Prisma client generated"))
        console.log("✅ " + ar("تم إنشاء عميل بريسما بنجاح"))
        console.log("")

        console.log("📦 " + en("Applying migration to database..."))
        console.log("📦 " + ar("جاري تطبيق الترحيل على قاعدة البيانات..."))
        execSync(`npx prisma migrate dev --name ${name}`, { stdio: "inherit", cwd })

        console.log("─".repeat(60))
        console.log("✅ " + en("Migration applied successfully!"))
        console.log("✅ " + ar("تم تطبيق الترحيل بنجاح!"))
        console.log("")
        console.log("🚀 " + en("Your database is ready."))
        console.log("🚀 " + ar("قاعدة البيانات جاهزة للاستخدام."))
        console.log("─".repeat(60))

    } catch (err) {
        console.log("")
        console.log("❌ " + en("Migration failed. Check the error above."))
        console.log("❌ " + ar("فشل الترحيل. الرجاء مراجعة الخطأ أعلاه."))
        console.log("")
        console.log("💡 " + en("You can also run manually: npx prisma migrate dev"))
        console.log("💡 " + ar("يمكنك أيضًا التشغيل يدويًا: npx prisma migrate dev"))
        console.log("")
        process.exit(1)
    }
}

async function migrateDrizzle(cwd: string) {
    const schemaPath = path.join(cwd, "src", "db", "auth-schema.ts")

    if (!(await fs.pathExists(schemaPath))) {
        console.log("❌ " + en("src/db/auth-schema.ts not found. Run: npx arraf-auth generate first."))
        console.log("❌ " + ar("لم يتم العثور على ملف المخطط. الرجاء تشغيل الأمر أولاً: npx arraf-auth generate"))
        console.log("")
        process.exit(1)
    }

    console.log("🔄 " + en("Running Drizzle migration..."))
    console.log("🔄 " + ar("جاري تشغيل ترحيل دريزّل..."))
    console.log("")

    try {
        execSync("npx drizzle-kit --version", { stdio: "ignore", cwd })
    } catch {
        console.log("❌ " + en("drizzle-kit not found. Run: pnpm add -D drizzle-kit"))
        console.log("❌ " + ar("لم يتم العثور على دريزّل-كيت. الرجاء تشغيل: pnpm add -D drizzle-kit"))
        console.log("")
        process.exit(1)
    }

    try {
        console.log("📤 " + en("Pushing schema to database..."))
        console.log("📤 " + ar("جاري دفع المخطط إلى قاعدة البيانات..."))
        execSync("npx drizzle-kit push", { stdio: "inherit", cwd })

        console.log("─".repeat(60))
        console.log("✅ " + en("Schema pushed successfully!"))
        console.log("✅ " + ar("تم دفع المخطط بنجاح!"))
        console.log("")
        console.log("🚀 " + en("Your database is ready."))
        console.log("🚀 " + ar("قاعدة البيانات جاهزة للاستخدام."))
        console.log("─".repeat(60))

    } catch {
        console.log("")
        console.log("❌ " + en("Migration failed. Check the error above."))
        console.log("❌ " + ar("فشل الترحيل. الرجاء مراجعة الخطأ أعلاه."))
        console.log("")
        console.log("💡 " + en("You can also run manually: npx drizzle-kit push"))
        console.log("💡 " + ar("يمكنك أيضًا التشغيل يدويًا: npx drizzle-kit push"))
        console.log("")
        process.exit(1)
    }
}