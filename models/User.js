const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  email_verify:{type: Boolean, require: false, default:false},
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'seller'], required: true },

  // User/Seller details - mandatory for sellers
  state: { type: String, required: false },       // Mandatory for sellers
  district: { type: String, required: false },    // Mandatory for sellers
  pincode: { type: String, required: false },     // Mandatory for sellers
  village: { type: String, required: false}, // Mandatory for sellers

  // KYC for sellers
  kycVerified: { type: String, enum: ['pending', 'in_progress', 'verified'], default: 'pending' }, // To mark KYC status
  aadhaarImageUrl: { type: String, required: false }, // URL to uploaded Aadhaar image

  // Profile Image
  imageUrl: { type: String, required: false },     // URL of the profile image

  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);

