const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

exports.register = async ({ name, email, password }) => {
  // Check existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("User already exists");
    error.statusCode = 400;
    throw error;
  }

  // 🔐 Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ⏳ OTP expiry (10 minutes)
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Create user
  const user = new User({
    name,
    email,
    password,
    otp,
    otpExpires,
    isVerified: false,
  });

  await user.save();

  // 📧 Send OTP email (your existing function)
  await sendEmail(email, name, otp);

  // ✅ Do NOT send token yet
  return {
    message: "Verification code sent to email",
  };
};


exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404; // Not Found
    throw error;
  } 

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid password");
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  const token = generateToken(
    user._id,
    user.name,
  
  );
  return { token, user };
};

const generateToken = (userId, name,  imageUrl) => {
  return jwt.sign(
    { userId, name, imageUrl },
    process.env.JWT_SECRET,
    { expiresIn: "90d" }
  );
};
