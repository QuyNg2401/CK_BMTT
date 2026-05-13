const bcrypt = require('bcrypt');
const otplib = require('otplib');
const jwt = require('jsonwebtoken');
const db = require('../configs/connectDB');
const createUserRepo = require('../repositories/user.repository');
const createMfaLogRepo = require('../repositories/mfa_log.repository');
const { decrypt } = require('../utilities/encryption');
const EmailService = require('./email.service');

// Khởi tạo Repository
const userRepo = createUserRepo(db);
const mfaLogRepo = createMfaLogRepo(db);

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const MFA_FAILED_WINDOW_MINUTES = 15;
const MFA_MAX_FAILED_ATTEMPTS = 5;
const TOTP_STEP_SECONDS = 30;

const getCurrentTotpStep = () => Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

const getTotpStepMatch = (token, secret) => {
    if (typeof otplib.generateSync !== 'function') {
        throw new Error('OTP library is not available');
    }

    const currentStep = getCurrentTotpStep();
    const steps = [currentStep - 1, currentStep, currentStep + 1];

    for (const step of steps) {
        const expected = otplib.generateSync({
            secret,
            strategy: 'totp',
            period: TOTP_STEP_SECONDS,
            epoch: step * TOTP_STEP_SECONDS,
        });
        if (expected === token) {
            return step;
        }
    }

    return null;
};

const createAccessToken = (user) => {
    return jwt.sign(
        { sub: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
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

const AuthService = {
    register: async (username, password) => {
        const existingUser = await userRepo.findByUsername(username);
        if (existingUser) throw new Error('The username already exists');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        return await userRepo.insertUser(username, passwordHash);
    },

    loginStep1: async (username, password) => {
        const user = await userRepo.getCredentialsByUsername(username);
        if (!user) throw new Error('Incorrect username, or password');

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw new Error('Incorrect username or password');

        const isMfaEnabled = Number(user.mfaEnabled) === 1;
        console.log('[AuthService.loginStep1] User:', { username, userId: user.id, mfaEnabled: user.mfaEnabled, isMfaEnabled });

        if (isMfaEnabled) {
            console.log('[AuthService.loginStep1] MFA enabled, returning REQUIRE_OTP');
            return {
                status: 'REQUIRE_OTP',
                userId: user.id,
                username: user.username,
                mfaEnabled: true
            };
        }

        console.log('[AuthService.loginStep1] MFA disabled, issuing token');
        const accessToken = createAccessToken(user);

        return {
            status: 'OK',
            accessToken,
            userId: user.id,
            username: user.username,
            mfaEnabled: false
        };
    },

    verifyLoginStep2: async (userId, token, ipAddress = '') => {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error('Invalid userId');
        }
        if (typeof token !== 'string' || token.trim().length === 0) {
            throw new Error('OTP token is required');
        }

        const user = await userRepo.findById(userId);
        if (!user) throw new Error('User not found');
        const isMfaEnabled = Number(user.mfa_enabled) === 1;
        if (!isMfaEnabled || !user.mfa_secret) {
            throw new Error('MFA is not enabled for this user');
        }

        const failedStats = await enforceMfaLockout(userId);

        const decryptedSecret = decrypt(user.mfa_secret);
        const matchedStep = getTotpStepMatch(token.trim(), decryptedSecret);
        const lastUsedStep = user.mfa_last_used_step == null ? null : Number(user.mfa_last_used_step);
        const isReplay = matchedStep !== null && lastUsedStep !== null && lastUsedStep === matchedStep;
        const isValid = matchedStep !== null && !isReplay;

        if (isValid && ipAddress) {
            try {
                const isKnownIp = await mfaLogRepo.hasSuccessfulLoginFromIP(userId, ipAddress);
                if (!isKnownIp) {
                    EmailService.sendNewDeviceAlert(user.username, ipAddress).catch(err =>
                        console.error('[AuthService] EmailService error:', err)
                    );
                }
            } catch (err) {
                console.error('[AuthService.verifyLoginStep2] Lỗi kiểm tra IP lạ:', err.message);
            }
        }

        try {
            await mfaLogRepo.saveLog(userId, ipAddress, isValid);
        } catch (logError) {
            console.warn('[AuthService.verifyLoginStep2] Failed to log MFA attempt:', logError.message);
        }
        if (!isValid) {
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
            if (isReplay) {
                throw buildOtpError('OTP_REPLAY', 'OTP already used. Wait for next code.', remainingAttempts, 0);
            }
            throw buildOtpError('OTP_INVALID', 'Invalid or expired OTP', remainingAttempts, 0);
        }

        try {
            await userRepo.updateMfaLastUsedStep(userId, matchedStep);
        } catch (updateError) {
            console.warn('[AuthService.verifyLoginStep2] Failed to update last used step:', updateError.message);
        }

        const accessToken = createAccessToken(user);

        return {
            status: 'OK',
            accessToken,
            userId: user.id,
            username: user.username
        };
    }
}

module.exports = AuthService;