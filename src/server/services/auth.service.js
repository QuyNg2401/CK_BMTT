const bcrypt = require('bcrypt');
const otplib = require('otplib');
const jwt = require('jsonwebtoken');
const db = require('../configs/connectDB');
const createUserRepo = require('../repositories/user.repository');
const createMfaLogRepo = require('../repositories/mfa_log.repository');

// Khởi tạo Repository
const userRepo = createUserRepo(db);
const mfaLogRepo = createMfaLogRepo(db);

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const MFA_FAILED_WINDOW_MINUTES = 15;
const MFA_MAX_FAILED_ATTEMPTS = 5;

const verifyTotp = (token, secret) => {
    if (typeof otplib.verifySync !== 'function') {
        throw new Error('OTP library is not available');
    }

    const result = otplib.verifySync({
        token,
        secret,
        strategy: 'totp',
    });

    if (typeof result === 'boolean') {
        return result;
    }

    return Boolean(result && result.valid);
};

const createAccessToken = (user) => {
    return jwt.sign(
        { sub: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const enforceMfaLockout = async (userId) => {
    const failedCount = await mfaLogRepo.countFailedAttempts(userId, MFA_FAILED_WINDOW_MINUTES);
    if (failedCount >= MFA_MAX_FAILED_ATTEMPTS) {
        throw new Error(`Too many failed attempts. Try again in ${MFA_FAILED_WINDOW_MINUTES} minutes.`);
    }
};

const AuthService = {
    register: async(username, password) => {
        const existingUser = await userRepo.findByUsername(username);
        if (existingUser) throw new Error('The username already exists');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        return await userRepo.insertUser(username, passwordHash);
    },

    loginStep1: async(username, password) => {
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

        await enforceMfaLockout(userId);

        const isValid = verifyTotp(token.trim(), user.mfa_secret);
        try {
            await mfaLogRepo.saveLog(userId, ipAddress, isValid);
        } catch (logError) {
            console.warn('[AuthService.verifyLoginStep2] Failed to log MFA attempt:', logError.message);
        }
        if (!isValid) throw new Error('Invalid or expired OTP');

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