const express = require("express");

const { createMfaSetup } = require("../services/mfaService");

const mfaRouter = express.Router();

// POST /api/mfa/secret
// body: { email: string }
mfaRouter.post("/secret", (req, res) => {
  const { email } = req.body ?? {};

  if (typeof email !== "string" || email.trim().length === 0) {
    return res.status(400).json({ message: "email is required" });
  }

  const issuer = process.env.MFA_ISSUER || "CK_BMTT";
  const { secretBase32, otpauthUri } = createMfaSetup({ email, issuer });

  return res.json({
    secret: secretBase32,
    otpauthUri,
  });
});

module.exports = { mfaRouter };

