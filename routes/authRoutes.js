const express = require('express');
const { register, login, sendOTP, verifyOTPAndRegister, updateProfile, getProfile, updateKYC } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
// const upload = require('../middlewares/uploadMiddleware')
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Define the destination folder for uploaded files.

// Use this in your route
router.put('/update-kyc', protect, upload.fields([{ name: 'aadhaarFront' }, { name: 'aadhaarBack' }, { name: 'userImage' }]), updateKYC);

router.post('/register', register);
router.post('/login', login);
// Send OTP API
router.post('/send-otp', sendOTP);
// Verify OTP and Register User API
router.post('/verify-otp-register', verifyOTPAndRegister);

// Update User Profile
// router.put('/update-profile', protect, updateProfile);

// Get User Profile
router.get('/profile', protect, getProfile);

// Route to update KYC details
// router.put('/update-kyc',protect, upload.fields([
//   { name: 'aadhaarFront', maxCount: 1 },
//   { name: 'aadhaarBack', maxCount: 1 },
//   {name:'userImage',maxCount: 1}
// ]), updateKYC);

module.exports = router;


