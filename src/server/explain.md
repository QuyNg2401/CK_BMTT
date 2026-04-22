# Giải thích nhanh: Base32 secret (MFA/TOTP)

## `utilities/base32.js` làm gì?
File `src/server/utilities/base32.js` chỉ làm 1 việc: **encode (chuyển dạng biểu diễn)** một `Buffer` (bytes nhị phân) thành **chuỗi Base32 theo chuẩn RFC4648** (alphabet `A-Z` và `2-7`).

Trong flow MFA/TOTP, secret thật sự được sinh ra bằng random bytes (ví dụ `crypto.randomBytes(20)`), sau đó **encode Base32** để:
- Dùng làm giá trị `secret=` trong `otpauthUri` (đưa vào QR/URL dạng text).
- Tương thích với các app Authenticator (Google Authenticator/Microsoft Authenticator thường dùng secret Base32).

> Lưu ý: **Base32 không phải mã hoá bảo mật**. Nó chỉ là *encoding* (đổi cách biểu diễn). Độ mạnh đến từ `randomBytes`.

## Logic encode Base32 (RFC4648) trong `base32Encode`

### 1) Alphabet Base32
`RFC4648_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"`

Base32 có 32 ký tự, nên mỗi ký tự output đại diện cho **5 bit** (\(2^5 = 32\)).

### 2) Dồn bit và “cắt” ra từng nhóm 5-bit
Trong `base32Encode`:
- `bits`: số bit đang có trong bộ đệm.
- `value`: bộ đệm bit (dồn byte vào đây).
- `output`: chuỗi kết quả.

Với mỗi `byte` trong `buf`:
- `value = (value << 8) | byte` → dồn thêm 8 bit.
- `bits += 8` → tăng số bit đang có.

Khi `bits >= 5`, ta có thể xuất ra 1 ký tự Base32:
- `index = (value >>> (bits - 5)) & 31`
  - `>>> (bits - 5)`: lấy đúng “cụm” 5 bit cần đọc.
  - `& 31`: giữ lại đúng 5 bit (giá trị 0..31).
- `output += RFC4648_ALPHABET[index]` → map 5 bit đó thành 1 ký tự.
- `bits -= 5` → đã tiêu thụ 5 bit.

### 3) Xử lý phần bit dư cuối cùng
Nếu kết thúc vòng lặp mà còn `bits > 0` (1–4 bit), ta “đệm” thêm 0 cho đủ 5 bit rồi xuất thêm 1 ký tự:
- `index = (value << (5 - bits)) & 31`

### 4) Padding `=` (tuỳ chọn)
Chuẩn RFC4648 có thể padding `=` để độ dài bội số 8, nhưng với secret TOTP thường **không cần padding**, nên code mặc định `padding = false`.

