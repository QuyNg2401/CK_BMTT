const { createTotpSecret } = require("../utilities/mfa");

function createMfaSetup({ email, issuer }) {
  if (typeof email !== "string" || email.trim().length === 0) {
    throw new Error("createMfaSetup: email is required");
  }

  const normalizedIssuer =
    typeof issuer === "string" && issuer.trim().length > 0 ? issuer.trim() : "CK_BMTT";

  const { secretBase32, otpauthUri } = createTotpSecret({
    issuer: normalizedIssuer,
    accountName: email.trim(),
  });

  return { secretBase32, otpauthUri };
}

module.exports = { createMfaSetup };

