const businessSchema = new mongoose.Schema({
  name: String,
  logo: String,
  baner:String,
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  Category:[{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  services: [String],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number], // lng, lat
  },
  kycId: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: "KYC",
  },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

businessSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Business", businessSchema);
