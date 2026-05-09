const express = require("express");
const router = express.Router();
const MfaController = require("../controllers/mfa.controller");

router.post("/secret", MfaController.createSecret);
// Alias to match naming used in project timeline docs.
router.post("/generate", MfaController.createSecret);
router.post("/setup", MfaController.setupForUser);
router.post("/verify-setup", MfaController.verify);

module.exports = router;

