const MfaService = require("../services/mfaService");

const MfaController = {
  createSecret: async (req, res) => {
    const { email } = req.body ?? {};

    if (typeof email !== "string" || email.trim().length === 0) {
      return res.status(400).json({ message: "email is required" });
    }

    try {
      const issuer = process.env.MFA_ISSUER || "CK_BMTT";
      const { secretBase32, otpauthUri, qrCodeDataUrl } = await MfaService.createMfaSetup({
        email,
        issuer,
      });

      return res.json({
        secret: secretBase32,
        otpauthUri,
        qrCodeDataUrl,
      });
    } catch (_error) {
      return res.status(500).json({ message: "failed to create mfa setup" });
    }
  },

  setupForUser: async (req, res) => {
    const { userId } = req.body ?? {};

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "userId must be a positive integer" });
    }

    try {
      const issuer = process.env.MFA_ISSUER || "CK_BMTT";
      const { secretBase32, otpauthUri, qrCodeDataUrl } =
        await MfaService.createMfaSetupForUserId({
          userId,
          issuer,
        });

      return res.json({
        userId,
        secret: secretBase32,
        otpauthUri,
        qrCodeDataUrl,
      });
    } catch (error) {
      const status = error?.statusCode === 404 ? 404 : 500;
      const message = status === 404 ? "user not found" : "failed to create mfa setup";
      return res.status(status).json({ message });
    }
  },
};

module.exports = MfaController;

