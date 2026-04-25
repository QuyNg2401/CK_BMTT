/**
 * @param {Object} db - Pool kết nối MySQL
 */
const createMfaLogRepository = (db) => {
    return {
        // Ghi lại kết quả mỗi lần user nhập mã (Đúng hoặc Sai)
        saveLog: async (userId, ipAddress, isSuccess) => {
            const [result] = await db.query(
                'INSERT INTO mfa_logs (user_id, ip_address, is_success) VALUES (?, ?, ?)',
                [userId, ipAddress, isSuccess ? 1 : 0]
            );
            return result.insertId;
        },

        // Lấy lịch sử log gần nhất của user
        getRecentLogsByUserId: async (userId, limit = 10) => {
            const [rows] = await db.query(
                'SELECT * FROM mfa_logs WHERE user_id = ? ORDER BY attempt_time DESC LIMIT ?',
                [userId, limit]
            );
            return rows;
        },

        // Đếm số lần nhập sai liên tiếp để khóa/cảnh báo
        countFailedAttempts: async (userId, minutes = 15) => {
            const [rows] = await db.query(
                `SELECT COUNT(*) as total 
                FROM mfa_logs 
                WHERE user_id = ? 
                AND is_success = 0 
                AND attempt_time >= NOW() - INTERVAL ? MINUTE`,
                [userId, minutes]
            );
            return rows[0].total;
        }
    };
};

module.exports = createMfaLogRepository;