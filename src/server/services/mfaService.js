const { createTotpSecret } = require("../utilities/mfa");
const QRCode = require("qrcode");

async function createMfaSetup({ email, issuer }) {
  if (typeof email !== "string" || email.trim().length === 0) {
    throw new Error("createMfaSetup: email is required");
  }

  const normalizedIssuer =
    typeof issuer === "string" && issuer.trim().length > 0 ? issuer.trim() : "CK_BMTT";

  const { secretBase32, otpauthUri } = createTotpSecret({
    issuer: normalizedIssuer,
    accountName: email.trim(),
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
  });

  return { secretBase32, otpauthUri, qrCodeDataUrl };
}

module.exports = { createMfaSetup };

