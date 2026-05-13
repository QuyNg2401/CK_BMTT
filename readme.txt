# 🔐 Hệ thống xác thực đa yếu tố (MFA) với TOTP

Ứng dụng web đăng nhập hai bước sử dụng TOTP + mật khẩu.

## 📋 Yêu cầu

- Node.js v20+
- MySQL 8.0+
- Google Authenticator / Authy

## 🚀 Quick Start

### 1. Database
```bash
mysql -u root < server/database/database.sql
```

### 2. Setup server/.env
```env
PORT=3000
JWT_SECRET=your_secret_key
MFA_ENCRYPTION_KEY=883f3019381fd35f9f78a160e1a8c60548f886357d02e097b42990b5f9dbacaa
SMTP_EMAIL=tienluc14052005@gmail.com
SMTP_PASSWORD=gmgayqiwulergnwm
```

### 3. Chạy backend
```bash
cd server
npm install
npm start
```
→ Server chạy tại http://localhost:3000

### 4. Chạy frontend
```bash
cd client
npm install
npm run dev
```
→ Mở http://localhost:5173


