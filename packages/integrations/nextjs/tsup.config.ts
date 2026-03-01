import { defineConfig } from "tsup"

export default defineConfig([
    {
        entry: { index: "src/index.ts" },
        format: ["esm", "cjs"],
        dts: true,
    },
    {
        entry: { client: "src/client.tsx" },
        format: ["esm", "cjs"],
        dts: true,
    },
    {
        entry: { middleware: "src/middleware.ts" },
        format: ["esm", "cjs"],
        dts: true,
    },
])