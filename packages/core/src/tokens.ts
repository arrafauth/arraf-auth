import { SignJWT, jwtVerify } from "jose"
import { nanoid } from "nanoid"

export function generateSessionToken(): string {
    return nanoid(64)
}

export function generateVerificationToken(): string {
    return nanoid(32)
}

interface JWTPayload {
    userId: string
    sessionId: string
    email: string
}

export async function signJWT(
    payload: JWTPayload,
    secret: string,
    expiresIn: string = "30d"
): Promise<string> {
    const key = new TextEncoder().encode(secret)
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(key)
}

export async function verifyJWT(
    token: string,
    secret: string
): Promise<JWTPayload | null> {
    try {
        const key = new TextEncoder().encode(secret)
        const { payload } = await jwtVerify(token, key)
        return payload as unknown as JWTPayload
    } catch {
        return null
    }
}