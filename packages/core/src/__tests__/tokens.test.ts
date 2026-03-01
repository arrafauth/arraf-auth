import { describe, it, expect } from "vitest"
import { generateSessionToken, signJWT, verifyJWT } from "../tokens"

describe("tokens", () => {
    it("generates a session token of correct length", () => {
        const token = generateSessionToken()
        expect(token.length).toBe(64)
    })

    it("generates unique tokens", () => {
        const tokens = new Set(Array.from({ length: 20 }, () => generateSessionToken()))
        expect(tokens.size).toBe(20)
    })

    it("signs and verifies a JWT", async () => {
        const secret = "test-secret-that-is-long-enough-32chars"
        const payload = { userId: "user_1", sessionId: "session_1", email: "test@test.com" }
        const token = await signJWT(payload, secret)
        const verified = await verifyJWT(token, secret)
        expect(verified?.userId).toBe("user_1")
        expect(verified?.sessionId).toBe("session_1")
    })

    it("returns null for invalid JWT", async () => {
        const verified = await verifyJWT("invalid.token.here", "secret")
        expect(verified).toBeNull()
    })
})