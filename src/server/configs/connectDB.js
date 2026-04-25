const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'totp_db',
    // Các cài đặt tối ưu cho Pool:
    waitForConnections: true,
    connectionLimit: 10, // Số lượng kết nối tối đa cùng lúc
    queueLimit: 0
});

pool.getConnection().then(connection => {
    console.log('✅ Đã kết nối MySQL thành công!');
    connection.release();
}).catch (err => {
    console.log('❌ Lỗi kết nối MySQL:', err.message);
});

module.exports = pool;