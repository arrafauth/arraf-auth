import { Command } from "commander"
import { generate } from "./commands/generate"
import { migrate } from "./commands/migrate"
import packageJson from "../package.json" assert { type: "json" }
import { generateSecretHash } from "./commands/secret";

const version = packageJson.version;
const RTL_EMBED = '\u202B'
const POP_DIR = '\u202C'

const bil = (en: string, ar: string) => `${en} | ${RTL_EMBED}${ar}${POP_DIR}`

const program = new Command()

program
    .name("arraf-auth")
    .description(`
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║    █████╗ ██████╗ ██████╗  █████╗ ███████╗    █████╗ ██╗   ██╗████████╗██╗   ██╗  ║
║   ██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝   ██╔══██╗██║   ██║╚══██╔══╝██║   ██║  ║
║   ███████║██████╔╝██████╔╝███████║█████╗     ███████║██║   ██║   ██║   ████████║  ║
║   ██╔══██║██╔══██╗██╔══██╗██╔══██║██╔══╝     ██╔══██║██║   ██║   ██║   ██║   ██║  ║
║   ██║  ██║██║  ██║██║  ██║██║  ██║██║        ██║  ██║╚██████╔╝   ██║   ██║   ██║  ║
║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝   ╚═╝  ║
║                                                                                   ║
║    🇺🇸  CLI for authentication schema management                                   ║
║    🇸🇦  واجهة أوامر لإدارة مخططات المصادقة                                         ║
║                                                                                   ║
║    📦 Version: ${version} | الإصدار: ${version}                                             ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
    `)
    .version(version, "-v, --version", bil("Show version", "عرض الإصدار"))

program
    .command("generate")
    .alias("g")
    .description(bil(
        "Generate auth schema for your database adapter",
        "إنشاء مخطط المصادقة لمحول قاعدة البيانات الخاص بك"
    ))
    .option("--cwd <path>", bil("Working directory", "مجلد العمل"), process.cwd())
    .action(async (options) => {
        console.log("")
        await generate({ cwd: options.cwd })
    })

program
    .command("migrate")
    .alias("m")
    .description(bil(
        "Apply generated schema to your database",
        "تطبيق المخطط المُنشأ على قاعدة البيانات"
    ))
    .option("--cwd <path>", bil("Working directory", "مجلد العمل"), process.cwd())
    .option(
        "--name <name>",
        bil(
            "Migration name (Prisma only)",
            "اسم الترحيل (لبريسما فقط)"
        ),
        "arraf_auth_migration"
    )
    .action(async (options) => {
        console.log("")
        await migrate({ cwd: options.cwd, name: options.name })
    })

program
    .command("secret")
    .alias("s")
    .description(
        bil(
            "Generating a secret key for your authentication",
            "يتم إنشاء مفتاح سري الخاص بمشروعك للمصادقة"
        )
    )
    .action(() => {
        const secret = generateSecretHash();

        console.log(`
Add the following to your .env file:
قم بإضافة المفتاح السري في ملف .env الخاص بك :

# Auth Secret
AUTH_SECRET=${secret}
`);
    });

program
    .command("help")
    .alias("h")
    .description(bil("Show help", "عرض المساعدة"))
    .action(() => {
        console.log("")
        program.help()
    })

program.addHelpText('after', `
📋 ${bil("Available Commands:", "الأوامر المتاحة:")}
   ${' '.repeat(2)}${bil("generate, g", "إنشاء, g")}    ${bil("- Generate auth schema", "- إنشاء مخطط المصادقة")}
   ${' '.repeat(2)}${bil("migrate, m", "ترحيل, m")}     ${bil("- Apply schema to database", "- تطبيق المخطط على قاعدة البيانات")}
   ${' '.repeat(2)}${bil("secret, s", "مفتاح, s")}     ${bil("- Generate secret key", "- إنشاء مفتاح سري للمصادقة")}
   ${' '.repeat(2)}${bil("help, h", "مساعدة, h")}       ${bil("- Show this help", "- عرض هذه المساعدة")}

📌 ${bil("Examples:", "أمثلة:")}
   ${' '.repeat(2)}$ arraf-auth generate
   ${' '.repeat(2)}$ arraf-auth g --cwd ./my-project
   ${' '.repeat(2)}$ arraf-auth migrate --name initial_setup
   ${' '.repeat(2)}$ arraf-auth m -v

🌐 ${bil("For more information:", "لمزيد من المعلومات:")}
   ${' '.repeat(2)}${bil("Documentation: https://arraf-auth.com", "الوثائق: https://arraf-auth.com/ar")}
   ${' '.repeat(2)}${bil("Report issues: https://github.com/arrafauth/arraf-auth/issues", "الإبلاغ عن مشكلة: https://github.com/arrafauth/arraf-auth/issues")}

${'─'.repeat(60)}
🇺🇸  Run 'arraf-auth help' or 'arraf-auth -h' for more details
🇸🇦  شغّل 'arraf-auth help' أو 'arraf-auth -h' لمزيد من التفاصيل
${'─'.repeat(60)}
`)

program.on('command:*', (commands) => {
    console.error(`
❌ ${bil("Invalid command:", "أمر غير صالح:")} ${commands[0]}
💡 ${bil("Run 'arraf-auth help' to see available commands", "شغّل 'arraf-auth help' لعرض الأوامر المتاحة")}
    `)
    process.exit(1)
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    console.log("")
    program.help()
}