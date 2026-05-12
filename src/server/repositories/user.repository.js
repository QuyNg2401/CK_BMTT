/**
 * Factory function tạo UserRepository
 * @param {Object} db - Pool kết nối MySQL
 */

// const { query } = require("../configs/connectDB")


const createUserRepository = (db) => {
    return {
        // --- NHÓM ĐĂNG KÝ & TÌM KIẾM ---
        insertUser: async (username, passwordHash) => {
            const [result] = await db.query(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                [username, passwordHash]
            );
            return result.insertId
        },

        findById: async (id) => {
            const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
            return rows[0] || null;
        },

        findByUsername: async (username) => {
            const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
            return rows[0] || null;
        },

        // --- NHÓM ĐĂNG NHẬP (Lấy dữ liệu xác thực) ---

        getCredentialsByUsername: async (username) => {
            const [rows] = await db.query(
                'SELECT id, username, password_hash AS passwordHash, mfa_enabled AS mfaEnabled, mfa_secret AS mfaSecret FROM users WHERE username = ?',
                [username]
            );
            return rows[0] || null;
        },

        // --- NHÓM CẤU HÌNH TOTP/MFA ---

        updateMfaSecret: async (userId, secret) => {
            const [result] = await db.query(
                'UPDATE users SET mfa_secret = ?, mfa_last_used_step = NULL WHERE id = ?',
                [secret, userId]
            );
            return result.affectedRows > 0;
        },

        updateMfaLastUsedStep: async (userId, step) => {
            const [result] = await db.query(
                'UPDATE users SET mfa_last_used_step = ? WHERE id = ?',
                [step, userId]
            );
            return result.affectedRows > 0;
        },

        setMfaStatus: async (userId, isEnabled) => {
            const [result] = await db.query(
                'UPDATE users SET mfa_enabled = ? WHERE id = ?',
                [isEnabled ? 1 : 0, userId]
            );
            return result.affectedRows > 0;
        },

        // Hàm reset khi user muốn tắt 2FA
        disableMfa: async (userId) => {
            const [result] = await db.query(
                'UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_last_used_step = NULL WHERE id = ?',
                [userId]
            );
            return result.affectedRows > 0;
        }
    }
}

module.exports = createUserRepository;