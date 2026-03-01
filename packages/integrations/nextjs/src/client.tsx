"use client"

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react"

interface User {
    id: string
    email: string | null
    phone: string | null
    name: string | null
    image: string | null
}

interface Session {
    id: string
    expiresAt: string
}

interface AuthState {
    user: User | null
    session: Session | null
    status: "loading" | "authenticated" | "unauthenticated"
}

interface AuthContextValue extends AuthState {
    signOut: () => Promise<void>
    refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
    children: React.ReactNode
    basePath?: string
}

export function AuthProvider({
    children,
    basePath = "/auth",
}: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        status: "loading",
    })

    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch(`${basePath}/session`, {
                credentials: "include",
            })
            const data = await res.json()

            if (data.user) {
                setState({
                    user: data.user,
                    session: data.session,
                    status: "authenticated",
                })
            } else {
                setState({ user: null, session: null, status: "unauthenticated" })
            }
        } catch {
            setState({ user: null, session: null, status: "unauthenticated" })
        }
    }, [basePath])

    useEffect(() => {
        fetchSession()
    }, [fetchSession])

    const signOut = async () => {
        await fetch(`${basePath}/sign-out`, {
            method: "POST",
            credentials: "include",
        })
        setState({ user: null, session: null, status: "unauthenticated" })
    }

    return (
        <AuthContext.Provider value={{ ...state, signOut, refresh: fetchSession }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useSession(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error("useSession must be used inside <AuthProvider>")
    }
    return ctx
}

export function useUser(): User | null {
    return useSession().user
}

interface SendOTPOptions {
    method: "phone" | "email"
    phone?: string
    email?: string
}

interface VerifyOTPOptions {
    method: "phone" | "email"
    phone?: string
    email?: string
    otp: string
    name?: string
}

export function useOTP(basePath: string = "/auth") {
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const sendOTP = async (options: SendOTPOptions) => {
        setSending(true)
        setError(null)
        try {
            const res = await fetch(`${basePath}/otp/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(options),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error)
                return { success: false, error: data.error }
            }
            return { success: true, maskedPhone: data.maskedPhone }
        } catch (err) {
            const msg = "Failed to send OTP"
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setSending(false)
        }
    }

    const verifyOTP = async (options: VerifyOTPOptions) => {
        setVerifying(true)
        setError(null)
        try {
            const res = await fetch(`${basePath}/otp/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(options),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error)
                return { success: false, error: data.error }
            }
            return { success: true, user: data.user, isNewUser: data.isNewUser }
        } catch (err) {
            const msg = "Failed to verify OTP"
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setVerifying(false)
        }
    }

    return { sendOTP, verifyOTP, sending, verifying, error }
}