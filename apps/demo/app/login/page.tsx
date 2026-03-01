"use client"

import { useState } from "react"
import { useOTP, useSession } from "@arraf-auth/nextjs/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const { status } = useSession()
    const { sendOTP, verifyOTP, sending, verifying, error } = useOTP("/api/auth")

    const [step, setStep] = useState<"input" | "otp">("input")
    const [phone, setPhone] = useState("")
    const [otp, setOtp] = useState("")
    const [masked, setMasked] = useState("")

    if (status === "authenticated") {
        router.push("/dashboard")
        return null
    }

    const handleSend = async () => {
        const result = await sendOTP({ method: "phone", phone })
        if (result.success) {
            setMasked(result.maskedPhone ?? phone)
            setStep("otp")
        }
    }

    const handleVerify = async () => {
        const result = await verifyOTP({ method: "phone", phone, otp })
        if (result.success) router.push("/dashboard")
    }

    return (
        <div style={{ maxWidth: 400, margin: "100px auto", padding: 24 }}>
            <h1>Sign in to Demo</h1>

            {step === "input" && (
                <>
                    <input
                        type="tel"
                        placeholder="05xxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: "100%", padding: 12, marginBottom: 12 }}
                    />
                    <button onClick={handleSend} disabled={sending} style={{ width: "100%" }}>
                        {sending ? "Sending..." : "Send OTP"}
                    </button>

                    <hr style={{ margin: "24px 0" }} />

                    <a href="/api/auth/sign-in/google" style={{ display: "block", marginBottom: 8 }}>
                        Sign in with Google
                    </a>
                    <a href="/api/auth/sign-in/github">
                        Sign in with GitHub
                    </a>
                </>
            )}

            {step === "otp" && (
                <>
                    <p>Code sent to {masked}</p>
                    <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        style={{ width: "100%", padding: 12, marginBottom: 12 }}
                    />
                    <button onClick={handleVerify} disabled={verifying} style={{ width: "100%" }}>
                        {verifying ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button onClick={() => setStep("input")} style={{ marginTop: 8 }}>
                        Back
                    </button>
                </>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    )
}