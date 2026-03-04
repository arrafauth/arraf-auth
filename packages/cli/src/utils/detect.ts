import path from "path"
import fs from "fs-extra"

export type Adapter = "prisma" | "drizzle" | null
// export type Plugin = "twoFactor" | "magicLink"

export interface DetectedConfig {
    adapter: Adapter
    // plugins: Plugin[]
    features: {
        emailVerification: boolean
        phoneOtp: boolean
        forgotPassword: boolean
        oauth: boolean
    }
}

export interface ArrafAuthCliConfig {
    adapter: "prisma" | "drizzle"
    // plugins?: Plugin[]
    features?: {
        emailVerification?: boolean
        phoneOtp?: boolean
        forgotPassword?: boolean
        oauth?: boolean
    }
}

export async function detectConfig(cwd: string): Promise<DetectedConfig> {
    const tsConfig = path.join(cwd, "arraf-auth.config.ts")
    const jsConfig = path.join(cwd, "arraf-auth.config.js")
    const jsonConfig = path.join(cwd, "arraf-auth.config.json")

    let config: ArrafAuthCliConfig | null = null

    if (await fs.pathExists(jsonConfig)) {
        config = await fs.readJson(jsonConfig)
    } else if (await fs.pathExists(jsConfig)) {
        config = require(jsConfig)
    } else if (await fs.pathExists(tsConfig)) {
        config = null
    }

    if (!config) {
        return {
            adapter: null,
            // plugins: [],
            features: {
                emailVerification: true,
                phoneOtp: true,
                forgotPassword: true,
                oauth: true,
            },
        }
    }

    return {
        adapter: config.adapter,
        // plugins: config.plugins ?? [],
        features: {
            emailVerification: config.features?.emailVerification ?? true,
            phoneOtp: config.features?.phoneOtp ?? true,
            forgotPassword: config.features?.forgotPassword ?? true,
            oauth: config.features?.oauth ?? true,
        },
    }
}

export async function detectAdapter(cwd: string): Promise<Adapter> {
    const hasPrisma = await fs.pathExists(path.join(cwd, "node_modules", "@prisma", "client"))
    const hasDrizzle = await fs.pathExists(path.join(cwd, "node_modules", "drizzle-orm"))

    if (hasPrisma && !hasDrizzle) return "prisma"
    if (hasDrizzle && !hasPrisma) return "drizzle"

    return null
}