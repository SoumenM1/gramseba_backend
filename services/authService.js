const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("User already exists");
    error.statusCode = 400; // Bad Request
    throw error;
  }

  const user = new User({ name, email, password, role });
  await user.save();
  const token = generateToken(user._id, user.role);
  return { token, user };
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
    user.role,
    user.kycVerified,
    user.imageUrl
  );
  return token;
};

const generateToken = (userId, name, role, kycVerified, imageUrl) => {
  return jwt.sign(
    { userId, name, role, kycVerified, imageUrl },
    process.env.JWT_SECRET,
    { expiresIn: "90d" }
  );
};
