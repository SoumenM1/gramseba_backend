const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ["store/shop", "doctor/clinic", "emergency/travel"], // Define allowed values
  },
  shopImage: { type: String },
  openAndCloseTime: { type: String, required: true },
  description_e: { type: String, required: true }, // Description in English
  description_b: { type: String, required: true }, // Description in Bengali or other language
  address: { type: String, required: true }, // Add more detailed address fields as needed
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" }, // [longitude, latitude]
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  qrCodeUrl: { type: String },
  block: { type: Boolean, required: false, default: false }, // Added block field (optional)
  visibility: { type: String, require: false, default: "public" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create a text index for the description fields (for both description_e and description_b)
shopSchema.index({shopName: 'text', description_e: "text", description_b: "text" });

module.exports = mongoose.model("Shop", shopSchema);
