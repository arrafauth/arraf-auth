export interface PhoneValidationResult {
    valid: boolean
    normalized?: string
    error?: string
}

export function normalizePhone(input: string): PhoneValidationResult {
    let phone = input.replace(/[\s\-\(\)]/g, "")

    if (/^05\d{8}$/.test(phone)) {
        phone = "+9665" + phone.slice(2)
    }

    if (phone.startsWith("00966")) {
        phone = "+" + phone.slice(2)
    }

    if (phone.startsWith("966") && !phone.startsWith("+")) {
        phone = "+" + phone
    }

    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        return { valid: false, error: "Invalid phone number format" }
    }

    return { valid: true, normalized: phone }
}

export function formatPhoneForDisplay(phone: string): string {
    if (phone.startsWith("+966")) {
        const local = "0" + phone.slice(4)
        return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    }
    return phone
}