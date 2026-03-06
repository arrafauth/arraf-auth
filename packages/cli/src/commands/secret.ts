import Crypto from "node:crypto";

export const generateSecretHash = () => {
    return Crypto.randomBytes(32).toString("hex");
};

export const secret = () => {
    const secret = generateSecretHash();

    console.log(`
Add the following to your .env file:
قم بإضافة المفتاح السري في ملف .env الخاص بك :

# Auth Secret
AUTH_SECRET=${secret}
`);
};