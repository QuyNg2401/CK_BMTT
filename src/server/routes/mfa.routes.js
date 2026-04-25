const express = require("express");

const { createMfaSetup } = require("../services/mfaService");

const mfaRouter = express.Router();

async function handleCreateSecret(req, res) {
  const { email } = req.body ?? {};

  if (typeof email !== "string" || email.trim().length === 0) {
    return res.status(400).json({ message: "email is required" });
  }

  try {
    const issuer = process.env.MFA_ISSUER || "CK_BMTT";
    const { secretBase32, otpauthUri, qrCodeDataUrl } = await createMfaSetup({ email, issuer });

    return res.json({
      secret: secretBase32,
      otpauthUri,
      qrCodeDataUrl,
    });
  } catch (_error) {
    return res.status(500).json({ message: "failed to create mfa setup" });
  }
}

// POST /api/mfa/secret
// body: { email: string }
mfaRouter.post("/secret", handleCreateSecret);

// Alias to match naming used in project timeline docs.
mfaRouter.post("/generate", handleCreateSecret);

module.exports = { mfaRouter };

