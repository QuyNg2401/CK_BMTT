## Hướng dẫn test Bước A (Setup MFA theo userId)

Bước A gồm 2 mục tiêu:
- Tạo `secret` + `otpauthUri` + `qrCodeDataUrl` (để quét bằng Google Authenticator)
- Lưu `secret` vào DB tại cột `users.mfa_secret` theo `userId`

---

## 1) Chuẩn bị Database

### Chạy server: node app.js
---

## 2) Tạo user để có userId

### Cách nhanh nhất: gọi API Register
Bước 1: Endpoint:
    - POST `http://localhost:3000/auth/register`

Body mẫu:
```json
{
  "username": "test01",
  "password": "Test@12345"
}

Bước 2: Lấy lưu secret key và tạo url QR
Endpoint:
    - POST `http://localhost:3000/mfa/setup`

Body mẫu:
```json
{
  "userId": "1", // lấy userId mới tạo
}

Bước 3: Lấy qrCodeDataUrl paste vào trình duyệt để hiển thị QR