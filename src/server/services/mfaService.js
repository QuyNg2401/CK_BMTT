const { createTotpSecret } = require("../utilities/mfa");
const QRCode = require("qrcode");

const db = require("../configs/connectDB");
const createUserRepo = require("../repositories/user.repository");

// import thư viện otp
const { verifySync } = require("otplib");
// Khởi tạo Repository
const userRepo = createUserRepo(db);

const MfaService = {
  createMfaSetup: async ({ email, issuer }) => {
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
  },

  createMfaSetupForUserId: async ({ userId, issuer }) => {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("createMfaSetupForUserId: userId must be a positive integer");
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const { secretBase32, otpauthUri, qrCodeDataUrl } = await MfaService.createMfaSetup({
      email: user.username,
      issuer,
    });

    const updated = await userRepo.updateMfaSecret(userId, secretBase32);
    if (!updated) {
      throw new Error("Failed to save mfa secret");
    }

    // Chưa bật 2FA cho đến khi user verify token thành công
    await userRepo.setMfaStatus(userId, false);

    return { secretBase32, otpauthUri, qrCodeDataUrl };
  },

  verifySetup: async ({ userId, token }) => {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new Error("không tìm thấy user");
    }
    if (!user.mfa_secret) {
      throw new Error("user này chưa bật 2FA");
    }
    const result = verifySync({
      secret: user.mfa_secret,
      token: token,
      strategy: 'totp'
    });
    const isValid = result.valid;

    if (isValid) {
      await userRepo.setMfaStatus(userId, true);
      return true;
    } else {
      return false;
    }
  },
};

module.exports = MfaService;
