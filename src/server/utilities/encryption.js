const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

// Lấy key từ file .env. Vì nó đang mã HEX nên dịch về Buffer 32 bytes
const getEncryptionKey = () => {
    const raw = process.env.MFA_ENCRYPTION_KEY;
    if (!raw) {
        throw new Error("MFA_ENCRYPTION_KEY is missing. Set a 64-hex-char key in .env");
    }
    return Buffer.from(raw, "hex");
};

const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
module.exports = { encrypt, decrypt };