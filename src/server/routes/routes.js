const express = require('express');
const router = express.Router();
const authRoute = require('./auth.routes');
const mfaRoute = require('./mfa.routes');

router.use('/auth', authRoute);
router.use('/mfa', mfaRoute);

module.exports = router;