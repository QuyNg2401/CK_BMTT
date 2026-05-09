const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

router.post('/register', AuthController.register);
router.post('/login', AuthController.loginStep1);
router.post('/verify-login', AuthController.verifyLoginStep2);

module.exports = router;