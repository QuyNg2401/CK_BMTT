const bcrypt = require('bcrypt');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const db = require('../configs/connectDB');
const createUserRepo = require('../repositories/user.repository');
const createMfaLogRepo = require('../repositories/mfa_log.repository');

// Khởi tạo Repository
const userRepo = createUserRepo(db);
const mfaLogRepo = createMfaLogRepo(db);

const AuthService = {
    register: async(username, password) => {
        const existingUser = await userRepo.findByUsername(username);
        if (existingUser) throw new Error('The username already exists');

        const salt = bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        return await userRepo.insertUser(username, passwordHash);
    },

    loginStep1: async(username, password) => {
        const user = await userRepo.getCredentialsByUsername(username);
        if (!user) throw new Error('Incorrect username, or password');

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw new Error('Incorrect username or password');

        return {
            userId: user.id,
            username: user.username,
            mfaEnabled: user.mfa_enabled === 1
        };
    },
}

module.exports = AuthService;