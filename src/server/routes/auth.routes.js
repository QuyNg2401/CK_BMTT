const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

const otpLoginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many OTP requests. Try again later.' },
});

router.post('/register', AuthController.register);
router.post('/login', AuthController.loginStep1);
router.post('/verify-login', otpLoginLimiter, AuthController.verifyLoginStep2);

module.exports = router;