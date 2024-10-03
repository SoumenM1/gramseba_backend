const express = require('express');
const { register, login, sendOTP, verifyOTPAndRegister } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);


router.post('/login', login);
// Send OTP API
router.post('/send-otp', sendOTP);
// Verify OTP and Register User API
router.post('/verify-otp-register', verifyOTPAndRegister);

// Profile update (after login)
// router.put('/update-profile/:userId', updateProfile);

module.exports = router;
