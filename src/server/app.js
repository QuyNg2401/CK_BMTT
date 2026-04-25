require('dotenv').config();
const express = require("express");
const cors = require('cors');

const db = require('./configs/connectDB');

const { routes } = require("./routes/routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: '🚀 Hệ thống đang hoạt động bình thường!' 
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/", router);

// ==========================================
// 3. XỬ LÝ LỖI (ERROR HANDLING)
// ==========================================

// Middleware 404: Xử lý khi Client gọi sai tên miền hoặc sai đường dẫn API
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `❌ Không tìm thấy API: ${req.method} ${req.originalUrl}`
  });
});

// Middleware 500: Bắt mọi lỗi hệ thống (Crash, lỗi logic, DB rớt...)
// Tránh việc server bị sập hoàn toàn khi có 1 API bị lỗi
app.use((err, req, res, next) => {
  console.error('🔥 Lỗi hệ thống nghiêm trọng:', err.stack);
  
  res.status(500).json({
    success: false,
    message: '❌ Đã xảy ra lỗi từ phía máy chủ!',
    // Chỉ hiển thị chi tiết lỗi nếu đang ở môi trường dev (bảo mật)
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});


// ==========================================
// 4. KHỞI ĐỘNG SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Môi trường: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`=================================`);
});

