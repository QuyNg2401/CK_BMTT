const { createTotpSecret } = require("../utilities/mfa");
const QRCode = require("qrcode");

const db = require("../configs/connectDB");
const createUserRepo = require("../repositories/user.repository");
const createMfaLogRepo = require("../repositories/mfa_log.repository");

const otplib = require("otplib");
// Khởi tạo Repository
const userRepo = createUserRepo(db);
const mfaLogRepo = createMfaLogRepo(db);

const MFA_FAILED_WINDOW_MINUTES = 15;
const MFA_MAX_FAILED_ATTEMPTS = 5;

const verifyTotp = (token, secret) => {
  if (typeof otplib.verifySync !== "function") {
    throw new Error("OTP library is not available");
  }

  const result = otplib.verifySync({
    token,
    secret,
    strategy: "totp",
  });

  if (typeof result === "boolean") {
    return result;
  }

  return Boolean(result && result.valid);
};

const enforceMfaLockout = async (userId) => {
  const failedCount = await mfaLogRepo.countFailedAttempts(userId, MFA_FAILED_WINDOW_MINUTES);
  if (failedCount >= MFA_MAX_FAILED_ATTEMPTS) {
    throw new Error(`Too many failed attempts. Try again in ${MFA_FAILED_WINDOW_MINUTES} minutes.`);
  }
};

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

  verifySetup: async ({ userId, token, ipAddress = '' }) => {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new Error("không tìm thấy user");
    }
    if (!user.mfa_secret) {
      throw new Error("user này chưa bật 2FA");
    }

    await enforceMfaLockout(userId);

    const isValid = verifyTotp(token, user.mfa_secret);
    try {
      await mfaLogRepo.saveLog(userId, ipAddress, isValid);
    } catch (logError) {
      console.warn('[MfaService.verifySetup] Failed to log MFA attempt:', logError.message);
    }
    if (isValid) {
      await userRepo.setMfaStatus(userId, true);
      return true;
    } else {
      return false;
    }
  },
};

module.exports = MfaService;
