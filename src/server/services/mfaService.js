const { createTotpSecret } = require("../utilities/mfa");
const QRCode = require("qrcode");

const db = require("../configs/connectDB");
const createUserRepo = require("../repositories/user.repository");
const createMfaLogRepo = require("../repositories/mfa_log.repository");

const otplib = require("otplib");
const { encrypt, decrypt } = require("../utilities/encryption");
// Khởi tạo Repository
const userRepo = createUserRepo(db);
const mfaLogRepo = createMfaLogRepo(db);

const MFA_FAILED_WINDOW_MINUTES = 15;
const MFA_MAX_FAILED_ATTEMPTS = 5;
const TOTP_STEP_SECONDS = 30;

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

const buildOtpError = (code, message, remainingAttempts, retryAfterSeconds) => {
  const error = new Error(message);
  error.code = code;
  error.remainingAttempts = remainingAttempts;
  error.retryAfterSeconds = retryAfterSeconds;
  return error;
};

const getRetryAfterSeconds = (oldestAttempt) => {
  if (!oldestAttempt) return MFA_FAILED_WINDOW_MINUTES * 60;
  const elapsedSeconds = Math.floor((Date.now() - new Date(oldestAttempt).getTime()) / 1000);
  return Math.max(0, MFA_FAILED_WINDOW_MINUTES * 60 - elapsedSeconds);
};

const getCurrentTotpStep = () => Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

const enforceMfaLockout = async (userId) => {
  const stats = await mfaLogRepo.getFailedAttemptStats(userId, MFA_FAILED_WINDOW_MINUTES);
  if (stats.total >= MFA_MAX_FAILED_ATTEMPTS) {
    const retryAfterSeconds = getRetryAfterSeconds(stats.oldestAttempt);
    throw buildOtpError(
      'OTP_LOCKED',
      `Too many failed attempts. Try again in ${MFA_FAILED_WINDOW_MINUTES} minutes.`,
      0,
      retryAfterSeconds
    );
  }
  return stats;
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

    const encryptedSecret = encrypt(secretBase32);
    const updated = await userRepo.updateMfaSecret(userId, encryptedSecret);
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

    const failedStats = await enforceMfaLockout(userId);

    const currentStep = getCurrentTotpStep();
    const lastUsedStep = user.mfa_last_used_step == null ? null : Number(user.mfa_last_used_step);
    if (lastUsedStep !== null && lastUsedStep === currentStep) {
      const remainingAttempts = Math.max(0, MFA_MAX_FAILED_ATTEMPTS - (failedStats.total + 1));
      try {
        await mfaLogRepo.saveLog(userId, ipAddress, false);
      } catch (logError) {
        console.warn('[MfaService.verifySetup] Failed to log MFA attempt:', logError.message);
      }
      if (remainingAttempts === 0) {
        const retryAfterSeconds = getRetryAfterSeconds(failedStats.oldestAttempt);
        throw buildOtpError(
          'OTP_LOCKED',
          `Too many failed attempts. Try again in ${MFA_FAILED_WINDOW_MINUTES} minutes.`,
          0,
          retryAfterSeconds
        );
      }
      throw buildOtpError('OTP_REPLAY', 'OTP already used. Wait for next code.', remainingAttempts, 0);
    }

    const decryptedSecret = decrypt(user.mfa_secret);
    const isValid = verifyTotp(token, decryptedSecret);
    try {
      await mfaLogRepo.saveLog(userId, ipAddress, isValid);
    } catch (logError) {
      console.warn('[MfaService.verifySetup] Failed to log MFA attempt:', logError.message);
    }
    if (isValid) {
      await userRepo.setMfaStatus(userId, true);
      try {
        await userRepo.updateMfaLastUsedStep(userId, currentStep);
      } catch (updateError) {
        console.warn('[MfaService.verifySetup] Failed to update last used step:', updateError.message);
      }
      return true;
    }

    const remainingAttempts = Math.max(0, MFA_MAX_FAILED_ATTEMPTS - (failedStats.total + 1));
    if (remainingAttempts === 0) {
      const retryAfterSeconds = getRetryAfterSeconds(failedStats.oldestAttempt);
      throw buildOtpError(
        'OTP_LOCKED',
        `Too many failed attempts. Try again in ${MFA_FAILED_WINDOW_MINUTES} minutes.`,
        0,
        retryAfterSeconds
      );
    }

    throw buildOtpError('OTP_INVALID', 'Mã token không hợp lệ hoặc đã hết hạn', remainingAttempts, 0);
  },
};

module.exports = MfaService;
