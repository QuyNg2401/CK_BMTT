const express = require("express");
const router = express.Router();
const MfaController = require("../controllers/mfa.controller");
const rateLimit = require('express-rate-limit');

const otpSetupLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many OTP requests. Try again later.' },
});

router.post("/secret", MfaController.createSecret);
// Alias to match naming used in project timeline docs.
router.post("/generate", MfaController.createSecret);
router.post("/setup", MfaController.setupForUser);
router.post("/verify-setup", otpSetupLimiter, MfaController.verify);

module.exports = router;

