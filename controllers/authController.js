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

// Update User Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, state, district, pincode, village, imageUrl } = req.body;

    // Build the update object
    const updateFields = { name, email, phone, state, district, pincode, village, imageUrl };

    // Remove undefined fields to prevent overwriting with undefined
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from the response

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    // Handle duplicate key errors (e.g., email or phone already exists)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} already in use.` });
    }

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
  const { email, name } = req.body;
  // Check if user already exists
  const user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: 'Email already registered.' });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Store OTP with a TTL (Time To Live) of 10 minutes (600000 ms)
  otpStorage.set(email, { otp, createdAt: Date.now() });

  try {
    // Send OTP via email (customize your sendEmail utility)
    await sendEmail(email, name, otp );
    
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
