const express = require('express');
const { register, login, sendOTP, verifyOTPAndRegister, updateProfile, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', register);


router.post('/login', login);
// Send OTP API
router.post('/send-otp', sendOTP);
// Verify OTP and Register User API
router.post('/verify-otp-register', verifyOTPAndRegister);

// Update User Profile
router.put('/update-profile', protect, updateProfile);

// Get User Profile
router.get('/profile', protect, getProfile);

module.exports = router;
