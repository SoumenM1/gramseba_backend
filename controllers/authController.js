const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("../config/cloudinaryConfig").cloudinary;
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate and send OTP
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  // 🔐 Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // ⏳ OTP expiry (10 minutes)
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  try {
    // Send OTP via email (customize your sendEmail utility)
    await sendEmail(email, user.name, otp);

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

// Resend OTP for email verification
exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Email already verified." });
  }

  // ⛔ Optional: prevent spamming (cooldown logic)
  if (user.otpExpires && user.otpExpires > Date.now()) {
    return res.status(429).json({
      message: "OTP already sent. Please wait before requesting again.",
    });
  }

  // 🔐 Generate new OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // ⏳ New expiry (10 minutes)
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  try {
    // Update OTP in DB
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send email
    await sendEmail(email, user.name, otp);

    return res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to resend OTP." });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.otp || !user.otpExpires) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please request again." });
    }

    if (user.otpExpires < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please resend OTP." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // ✅ Mark verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "OTP verification failed." });
  }
};

exports.forgetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Check if OTP exists for the email
  const storedOTPData = otpStorage.get(email);
  if (!storedOTPData) {
    return res.status(400).json({ message: "OTP expired or invalid." });
  }

  // Check if OTP matches
  const { otp: storedOTP, createdAt } = storedOTPData;
  if (otp !== storedOTP) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  // Check if OTP is older than 10 minutes
  const expirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  if (Date.now() - createdAt > expirationTime) {
    otpStorage.delete(email); // Delete expired OTP
    return res.status(400).json({ message: "OTP expired." });
  }

  // OTP is valid, proceed to reset password
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update user password
    user.password = newPassword; // Make sure to hash this password before saving
    await user.save(); // Save updated user to the database

    otpStorage.delete(email); // Delete OTP after successful password reset
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password." });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists." });
    // 🔐 Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

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
    return res.status(201).json({
      message: "User registered. Please verify your email with the OTP sent.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Email not verified. Please verify your email." });
    }

    const token = generateToken(user._id, user.name);
    return res.status(200).json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: "Login failed." });
  }
};

// PUT /api/profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { name, bio, dob, gender } = req.body;
    if (!name || !bio || !dob || !gender) {
      return res.status(400).json({ message: "fields is required" });
    }
    const updateData = { name, bio, dob, gender };
    const user = await User.findById(userId);
    // ✅ If user uploads an image

    if (req.file) {
      if (user.imagePublicId) {
        await cloudinary.uploader.destroy(user.imagePublicId);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "/gram_bazer/profiles",
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" }, 
          { fetch_format: "auto" }, 
        ],
      });

      updateData.imageUrl = result.secure_url;
      updateData.imagePublicId = result.public_id;
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Failed to delete local file:", err);
        } else {
          console.log("Local file deleted:", req.file.path);
        }
      });
    }

    await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    return res.status(200).json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select(
      "-password -otp -otpExpires -_id",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile." });
  }
};

const generateToken = (userId, name, imageUrl) => {
  return jwt.sign({ userId, name, imageUrl }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};
