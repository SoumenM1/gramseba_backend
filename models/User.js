const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    otp: String,
    otpExpires: Date,
    dob: {
      type: Date,
    },
    gender: { type: String, enum: ["male", "female", "other"] },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
