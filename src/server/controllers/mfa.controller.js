const MfaService = require("../services/mfaService");

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '';
};

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
      console.error('[MfaController.setupForUser] Error:', error);
      const status = error?.statusCode === 404 ? 404 : 500;
      const message = status === 404 ? "user not found" : "failed to create mfa setup";
      return res.status(status).json({ message });
    }
  },
  verify: async (req, res) => {
    const { userId, token } = req.body ?? {};
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "UserId không hợp lệ" });
    }
    if (typeof token !== "string" || token.trim().length === 0) {
      return res.status(400).json({ message: "Thiếu mã token 2FA" })
    } try {
      const ipAddress = getClientIp(req);
      const isValid = await MfaService.verifySetup({ userId, token, ipAddress });
      if (isValid) {
        return res.status(200).json({
          message: "Đã xác thực 2FA thành công"
        })
      } else {
        return res.status(400).json({ message: "Mã token không hợp lệ hoặc đã hết hạn" })
      }
    } catch (error) {
      console.log("LỖI CHI TIẾT:", error);
      if (error?.code === 'OTP_LOCKED') {
        return res.status(429).json({
          message: error.message,
          remainingAttempts: error.remainingAttempts ?? 0,
          retryAfterSeconds: error.retryAfterSeconds ?? 0,
        });
      }
      if (error?.code === 'OTP_INVALID' || error?.code === 'OTP_REPLAY') {
        return res.status(400).json({
          message: error.message,
          remainingAttempts: error.remainingAttempts ?? 0,
          retryAfterSeconds: 0,
        });
      }
      return res.status(500).json({
        message: error.message
      })
    }



  }

};


module.exports = MfaController;

