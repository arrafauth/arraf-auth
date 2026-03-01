import { describe, it, expect } from "vitest"
import { generateOTP } from "../otp"

describe("otp", () => {
    it("generates a 6-digit OTP by default", () => {
        const otp = generateOTP()
        expect(otp).toHaveLength(6)
        expect(Number(otp)).toBeGreaterThanOrEqual(100000)
        expect(Number(otp)).toBeLessThanOrEqual(999999)
    })

    it("generates OTP of custom length", () => {
        const otp = generateOTP(4)
        expect(otp).toHaveLength(4)
    })

    it("generates different OTPs each time", () => {
        const otps = new Set(Array.from({ length: 10 }, () => generateOTP()))
        expect(otps.size).toBeGreaterThan(1)
    })
})