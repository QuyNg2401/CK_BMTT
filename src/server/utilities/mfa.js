const crypto = require("crypto");

const { base32Encode } = require("./base32");

function buildTotpOtpAuthUri({ issuer, accountName, secretBase32 }) {
  const label = `${issuer}:${accountName}`;
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

function createTotpSecret({ issuer, accountName, bytes = 20 } = {}) {
  if (typeof issuer !== "string" || issuer.trim().length === 0) {
    throw new Error("createTotpSecret: issuer is required");
  }
  if (typeof accountName !== "string" || accountName.trim().length === 0) {
    throw new Error("createTotpSecret: accountName is required");
  }
  if (!Number.isInteger(bytes) || bytes < 10) {
    throw new Error("createTotpSecret: bytes must be an integer >= 10");
  }

  const raw = crypto.randomBytes(bytes);
  const secretBase32 = base32Encode(raw, { padding: false });
  const otpauthUri = buildTotpOtpAuthUri({
    issuer: issuer.trim(),
    accountName: accountName.trim(),
    secretBase32,
  });

  return { secretBase32, otpauthUri };
}

module.exports = { createTotpSecret, buildTotpOtpAuthUri };

