import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Uses ENCRYPTION_KEY from environment, or a fallback for development.
// Key must be exactly 32 bytes (256 bits).
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "fallback_secret_key_32_bytes_long";

// Helper to ensure key is exactly 32 bytes
const getKey = () => {
    return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
};

export const encryptAES = (text: string): string => {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Return iv:encrypted
    return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptAES = (encryptedText: string): string | null => {
    if (!encryptedText) return null;
    try {
        const textParts = encryptedText.split(":");
        const ivHex = textParts.shift();
        const encryptedHex = textParts.join(":");
        if (!ivHex || !encryptedHex) return null;

        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        console.error("AES Decryption error:", error);
        return null;
    }
};
