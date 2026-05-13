const nodemailer = require('nodemailer');
require('dotenv').config();

const EmailService = {
    /**
     * Gửi email cảnh báo đăng nhập từ thiết bị/IP lạ
     * @param {string} email - Email của người dùng
     * @param {string} ipAddress - Địa chỉ IP lạ
     */
    sendNewDeviceAlert: async (email, ipAddress) => {
        try {
            const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            
            const smtpEmail = process.env.SMTP_EMAIL;
            const smtpPassword = process.env.SMTP_PASSWORD;

            // NẾU CHƯA CẤU HÌNH .ENV THÌ CHUYỂN VỀ CHẾ ĐỘ MOCK ĐỂ KHÔNG BỊ LỖI
            if (!smtpEmail || !smtpPassword) {
                console.warn('⚠️ [EmailService] Chưa cấu hình SMTP_EMAIL và SMTP_PASSWORD trong file .env!');
                console.log('Chuyển sang chế độ MOCK (in ra Console):');
                console.log(`To: ${email} | Subject: ⚠️ Cảnh báo Bảo mật: Đăng nhập từ IP lạ`);
                return true;
            }

            // Cấu hình transporter (Mặc định cấu hình cho Gmail)
            const transporter = nodemailer.createTransport({
                service: 'gmail', 
                auth: {
                    user: smtpEmail,
                    pass: smtpPassword
                }
            });

            // Nội dung Email dạng HTML cho đẹp và chuyên nghiệp
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px;">
                    <h2 style="color: #d9534f; border-bottom: 1px solid #eee; padding-bottom: 10px;">⚠️ Cảnh báo Bảo mật: Đăng nhập từ IP lạ</h2>
                    <p>Chào bạn,</p>
                    <p>Hệ thống vừa phát hiện một lượt đăng nhập thành công vào tài khoản của bạn từ một địa chỉ IP chưa từng sử dụng trước đây.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #f0ad4e; margin: 20px 0;">
                        <ul style="list-style-type: none; padding-left: 0; margin: 0;">
                            <li style="margin-bottom: 5px;"><strong>🌐 Địa chỉ IP:</strong> ${ipAddress}</li>
                            <li><strong>🕒 Thời gian:</strong> ${time}</li>
                        </ul>
                    </div>
                    <p>Nếu bạn vừa đăng nhập, bạn có thể an tâm bỏ qua email này.</p>
                    <p style="color: #d9534f; font-weight: bold; background-color: #fdf2f2; padding: 10px; border-radius: 3px;">
                        Nếu KHÔNG PHẢI bạn, có thể bạn đang bị tấn công Phishing. Vui lòng liên hệ Admin hoặc ĐỔI MẬT KHẨU ngay lập tức để bảo vệ tài khoản!
                    </p>
                    <p style="font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                        Email này được gửi tự động từ hệ thống cảnh báo bảo mật. Vui lòng không phản hồi.
                    </p>
                </div>
            `;

            // Thực hiện gửi
            const info = await transporter.sendMail({
                from: `"Hệ thống Bảo Mật MFA" <${smtpEmail}>`,
                to: email, // Email của nạn nhân/người dùng
                subject: '⚠️ Cảnh báo khẩn cấp: Đăng nhập từ IP lạ',
                html: htmlContent
            });

            console.log(`✅ [EmailService] Đã gửi cảnh báo IP lạ thành công đến ${email} (ID: ${info.messageId})`);
            return true;

        } catch (error) {
            console.error('[EmailService] Gửi email thất bại. Vui lòng kiểm tra lại App Password:', error.message);
            return false;
        }
    }
};

module.exports = EmailService;
