import { describe, it, expect } from "vitest"
import { hashPassword, verifyPassword } from "../password"

describe("password", () => {
  it("hashes a password", async () => {
    const hash = await hashPassword("mypassword123")
    expect(hash).not.toBe("mypassword123")
    expect(hash.length).toBeGreaterThan(20)
  })

  it("verifies correct password", async () => {
    const hash = await hashPassword("mypassword123")
    const valid = await verifyPassword("mypassword123", hash)
    expect(valid).toBe(true)
  })

  it("rejects wrong password", async () => {
    const hash = await hashPassword("mypassword123")
    const valid = await verifyPassword("wrongpassword", hash)
    expect(valid).toBe(false)
  })
})