"use client"

import { AuthProvider } from "@arraf-auth/nextjs/client"

export function Providers({ children }: { children: React.ReactNode }) {
    return <AuthProvider basePath="/api/auth">{children}</AuthProvider>
}
