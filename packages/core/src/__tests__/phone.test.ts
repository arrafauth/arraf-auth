import { describe, it, expect } from "vitest"
import { normalizePhone } from "../phone"

describe("normalizePhone", () => {
    it("normalizes Saudi local format 05xxxxxxxx", () => {
        const result = normalizePhone("0501234567")
        expect(result.valid).toBe(true)
        expect(result.normalized).toBe("+966501234567")
    })

    it("normalizes 00966 format", () => {
        const result = normalizePhone("00966501234567")
        expect(result.valid).toBe(true)
        expect(result.normalized).toBe("+966501234567")
    })

    it("accepts already normalized +966 format", () => {
        const result = normalizePhone("+966501234567")
        expect(result.valid).toBe(true)
        expect(result.normalized).toBe("+966501234567")
    })

    it("rejects invalid phone number", () => {
        const result = normalizePhone("12345")
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
    })

    it("handles spaces and dashes", () => {
        const result = normalizePhone("050 123 4567")
        expect(result.valid).toBe(true)
        expect(result.normalized).toBe("+966501234567")
    })
})