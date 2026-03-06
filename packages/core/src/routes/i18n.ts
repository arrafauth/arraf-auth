export type LocalizedMessage = {
    en: string
    ar: string
}

export function t(en: string, ar: string): LocalizedMessage {
    return { en, ar }
}

export function localizeError(error?: string): LocalizedMessage {
    if (!error) {
        return t("Unknown error", "خطأ غير معروف")
    }

    const exact = exactErrors[error]
    if (exact) {
        return t(error, exact)
    }

    if (error.startsWith("OAuth denied: ")) {
        return t(error, `تم رفض OAuth: ${error.slice("OAuth denied: ".length)}`)
    }

    const providerNotConfigured = error.match(/^Provider "(.+)" not configured$/)
    if (providerNotConfigured) {
        return t(error, `المزوّد "${providerNotConfigured[1]}" غير مُهيأ`)
    }

    const invalidCode = error.match(/^Invalid code\. (\d+) attempts remaining\.$/)
    if (invalidCode) {
        return t(error, `رمز غير صحيح. تبقّى ${invalidCode[1]} محاولة.`)
    }

    const invalidOtp = error.match(/^Invalid OTP\. (\d+) attempts remaining\.$/)
    if (invalidOtp) {
        return t(error, `رمز OTP غير صحيح. تبقّى ${invalidOtp[1]} محاولة.`)
    }

    return t(error, error)
}

const exactErrors: Record<string, string> = {
    "Invalid input": "مدخلات غير صالحة",
    "Invalid credentials": "بيانات الاعتماد غير صحيحة",
    "Please verify your phone number with OTP": "يرجى التحقق من رقم الهاتف باستخدام OTP",
    "Email already in use": "البريد الإلكتروني مستخدم بالفعل",
    "Phone already in use": "رقم الهاتف مستخدم بالفعل",
    "No reset request found. Please request a new code.": "لا يوجد طلب إعادة تعيين. يرجى طلب رمز جديد.",
    "Code expired.": "انتهت صلاحية الرمز.",
    "Too many attempts. Request a new code.": "محاولات كثيرة جدًا. اطلب رمزًا جديدًا.",
    "User not found": "المستخدم غير موجود",
    "No reset request found. Please request a new one.": "لا يوجد طلب إعادة تعيين. يرجى طلب طلب جديد.",
    "Reset request expired.": "انتهت صلاحية طلب إعادة التعيين.",
    "Invalid reset token": "رمز إعادة التعيين غير صالح",
    "Email already verified": "تم التحقق من البريد الإلكتروني بالفعل",
    "Already verified": "تم التحقق بالفعل",
    "Invalid or expired token": "الرمز غير صالح أو منتهي الصلاحية",
    "Token expired": "انتهت صلاحية الرمز",
    "Invalid token": "الرمز غير صالح",
    "SMS provider not configured": "مزوّد الرسائل القصيرة غير مُهيأ",
    "OTP sent to phone": "تم إرسال رمز OTP إلى الهاتف",
    "Email OTP not yet configured": "OTP عبر البريد الإلكتروني غير مُهيأ بعد",
    "Provider not found": "المزوّد غير موجود",
    "Missing code or state": "رمز التفويض أو الحالة مفقودان",
    "Invalid state - possible CSRF attack": "حالة غير صالحة - هجوم CSRF محتمل",
    "Provider did not return an email": "لم يُرجع المزوّد بريدًا إلكترونيًا",
    "OAuth callback failed": "فشلت عملية OAuth callback",
    "This account uses OTP sign-in. No password to reset.": "هذا الحساب يستخدم تسجيل الدخول عبر OTP. لا توجد كلمة مرور لإعادة تعيينها.",
    "This account uses social sign-in. No password to reset.": "هذا الحساب يستخدم تسجيل الدخول الاجتماعي. لا توجد كلمة مرور لإعادة تعيينها.",
    "Invalid phone number format": "تنسيق رقم الهاتف غير صالح",
    "No OTP found. Please request a new one.": "لا يوجد رمز OTP. يرجى طلب رمز جديد.",
    "OTP expired. Please request a new one.": "انتهت صلاحية OTP. يرجى طلب رمز جديد.",
    "Too many attempts. Please request a new OTP.": "محاولات كثيرة جدًا. يرجى طلب OTP جديد.",
    "SMS sending failed": "فشل إرسال الرسالة القصيرة",
}
