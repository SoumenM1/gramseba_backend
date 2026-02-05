const express = require('express');
const { register, login, sendOTP, verifyOTP, forgetPassword, getProfile,updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware')
const router = express.Router();


router.post('/register', register);
router.post('/login', login);
// Send OTP API
router.post('/send-otp', sendOTP);
router.post('/resend-otp', sendOTP);
// Verify OTP and Register User API
router.post('/verify-otp-register', verifyOTP);

//forget-password
router.post('/reset-password',forgetPassword)

// Update User Profile
router.put('/update-profile', protect, upload.single("image"), updateProfile);

// Get User Profile
router.get('/profile', protect, getProfile);


module.exports = router;


