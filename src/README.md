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
MFA_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
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

## 📱 Quy trình

1. **Đăng ký** → username + password
2. **Đăng nhập lần đầu** → vào màn hình bật 2FA
3. **Bật 2FA** → quét QR bằng Authenticator, nhập OTP
4. **Đăng nhập sau này** → username + password + OTP

## 🔒 Bảo mật

- ✅ bcrypt hashing (password)
- ✅ TOTP (RFC 6238, HMAC-SHA1)
- ✅ AES-256-CBC (secret encryption)
- ✅ Prepared statements (chống SQL Injection)
- ✅ Lockout sau 5 lần sai OTP / 15 phút
- ✅ Anti-replay OTP
- ✅ Cảnh báo IP lạ qua email
