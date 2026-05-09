/**
 * @param {Object} db - Pool kết nối MySQL
 */
const createMfaLogRepository = (db) => {
    let userIdColumn = null;

    const resolveUserIdColumn = async () => {
        if (userIdColumn) return userIdColumn;

        const [rows] = await db.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'mfa_logs'
               AND COLUMN_NAME IN ('user_id', 'user')`
        );

        userIdColumn = rows?.[0]?.COLUMN_NAME || 'user_id';
        return userIdColumn;
    };

    return {
        // Ghi lại kết quả mỗi lần user nhập mã (Đúng hoặc Sai)
        saveLog: async (userId, ipAddress, isSuccess) => {
            const columnName = await resolveUserIdColumn();
            const [result] = await db.query(
                `INSERT INTO mfa_logs (${columnName}, ip_address, is_success) VALUES (?, ?, ?)`,
                [userId, ipAddress, isSuccess ? 1 : 0]
            );
            return result.insertId;
        },

        // Lấy lịch sử log gần nhất của user
        getRecentLogsByUserId: async (userId, limit = 10) => {
            const columnName = await resolveUserIdColumn();
            const [rows] = await db.query(
                `SELECT * FROM mfa_logs WHERE ${columnName} = ? ORDER BY attempt_time DESC LIMIT ?`,
                [userId, limit]
            );
            return rows;
        },

        // Đếm số lần nhập sai liên tiếp để khóa/cảnh báo
        countFailedAttempts: async (userId, minutes = 15) => {
            const columnName = await resolveUserIdColumn();
            const [rows] = await db.query(
                `SELECT COUNT(*) as total 
                FROM mfa_logs 
                WHERE ${columnName} = ? 
                AND is_success = 0 
                AND attempt_time >= NOW() - INTERVAL ? MINUTE`,
                [userId, minutes]
            );
            return rows[0].total;
        }
    };
};

module.exports = createMfaLogRepository;