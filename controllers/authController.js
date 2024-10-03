const crypto = require('crypto');
const User = require('../models/User');
const authService = require('../services/authService');
const sendEmail = require('../utils/sendEmail'); 
const otpStorage = new Map(); // Using local storage (can use Redis in production)

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

exports.updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { email, phone } = req.body;

  // Check if email or phone is already in use
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }], 
    _id: { $ne: userId } // Exclude current user
  });
  if (existingUser) {
    return res.status(400).json({ message: 'Email or phone already in use.' });
  }

  try {
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(userId, { email, phone }, { new: true });
    return res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
};

// Generate and send OTP
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  // Check if user already exists
  const user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: 'Email already registered.' });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Store OTP with a TTL (Time To Live) of 10 minutes (600000 ms)
  otpStorage.set(email, { otp, createdAt: Date.now() });

  try {
    // Send OTP via email (customize your sendEmail utility)
    await sendEmail(email, 'Verify Your Email', `Your OTP is: ${otp}`);
    
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
