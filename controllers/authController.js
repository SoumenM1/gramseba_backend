const crypto = require('crypto');
const User = require('../models/User');
const authService = require('../services/authService');
const sendEmail = require('../utils/sendEmail'); 
const otpStorage = new Map(); 
const cloudinary = require('../config/cloudinaryConfig').cloudinary;
const fs = require('fs');

exports.updateKYC = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is missing from the request.',
      });
    }
    const { state, district, pincode, village, phone } = req.body;
    if (!state || !district || !pincode || !village || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields (state, district, pincode, village, and phone) are required.',
      });
    }
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode. It should be a 6-digit number.',
      });
    }
    let aadhaarFrontUrl = '', aadhaarBackUrl = '', imageUrl = '';
    if (req.files?.aadhaarFront) {
      const result = await cloudinary.uploader.upload(req.files.aadhaarFront[0].path, {
        folder: 'gram_bazer/kyc',
        public_id: `aadhaar-front-${userId}-${Date.now()}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, 
          { quality: 'auto:good' },
          { fetch_format: 'auto' } 
        ],
      });
      aadhaarFrontUrl = result.secure_url;
      fs.unlinkSync(req.files.aadhaarFront[0].path);
    }
    if (req.files?.aadhaarBack) {
      const result = await cloudinary.uploader.upload(req.files.aadhaarBack[0].path, {
        folder: 'gram_bazer/kyc',
        public_id: `aadhaar-back-${userId}-${Date.now()}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, 
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      });
      aadhaarBackUrl = result.secure_url;
      fs.unlinkSync(req.files.aadhaarBack[0].path);
    }
    if (req.files?.userImage) {
      const result = await cloudinary.uploader.upload(req.files.userImage[0].path, {
        folder: 'gram_bazer/kyc',
        public_id: `user-${userId}-${Date.now()}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, 
          { quality: 'auto:good' }, 
          { fetch_format: 'auto' }
        ]
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.files.userImage[0].path);
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          state,
          district,
          pincode,
          village,
          phone,
          aadhaarFrontUrl: aadhaarFrontUrl || undefined,
          aadhaarBackUrl: aadhaarBackUrl || undefined,
          kycVerified: 'in_progress',
          imageUrl: imageUrl || undefined,
        },
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'KYC details updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating KYC:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const token = await authService.login(req.body);
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

// Get User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Generate and send OTP
exports.sendOTP = async (req, res) => {
  const { email,name,forget} = req.body;
 
  // Check if user exists
  const user = await User.findOne({ email });

  // If not forgetting password, check if user already exists
  if (!forget) {
    if (user) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
  } else {
    // If forgetting password, check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
  }
 
  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Store OTP with a TTL (Time To Live) of 10 minutes (600000 ms)
  otpStorage.set(email, { otp, createdAt: Date.now() });

  try {
    // Send OTP via email (customize your sendEmail utility)
    await sendEmail(email, user ? user.name : name, otp, forget );
    
    return res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send OTP.' });
  }
};

exports.verifyOTPAndRegister = async (req, res) => {
  const { email, otp, name, password, role } = req.body; // role: 'user' or 'seller'
  // Check if OTP exists for the email
  const storedOTPData = otpStorage.get(email);
  if (!storedOTPData) {
    return res.status(400).json({ message: 'OTP expired or invalid.' });
  }

  // Check if OTP matches
  const { otp: storedOTP, createdAt } = storedOTPData;
  if (otp !== storedOTP) {
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  // Check if OTP is older than 10 minutes
  const expirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  if (Date.now() - createdAt > expirationTime) {
    otpStorage.delete(email); // Delete expired OTP
    return res.status(400).json({ message: 'OTP expired.' });
  }

  // OTP is valid, proceed with registration
  const newUser = new User({ email, name, password, role , email_verify:true });

  try {
    await newUser.save(); // Save user to the database
    otpStorage.delete(email); // Delete OTP after successful registration
    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user.' });
  }
};

exports.forgetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Check if OTP exists for the email
  const storedOTPData = otpStorage.get(email);
  if (!storedOTPData) {
    return res.status(400).json({ message: 'OTP expired or invalid.' });
  }

  // Check if OTP matches
  const { otp: storedOTP, createdAt } = storedOTPData;
  if (otp !== storedOTP) {
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  // Check if OTP is older than 10 minutes
  const expirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  if (Date.now() - createdAt > expirationTime) {
    otpStorage.delete(email); // Delete expired OTP
    return res.status(400).json({ message: 'OTP expired.' });
  }

  // OTP is valid, proceed to reset password
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user password
    user.password = newPassword; // Make sure to hash this password before saving
    await user.save(); // Save updated user to the database

    otpStorage.delete(email); // Delete OTP after successful password reset
    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reset password.' });
  }
};