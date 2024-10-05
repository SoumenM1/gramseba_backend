const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  description_e: { type: String, required: true },
  description_b: { type: String, required: true },
  address:{type: String, required: true},
  location: { 
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }  // [longitude, latitude]
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Create a text index for the description field
shopSchema.index({ description: 'text' });

module.exports = mongoose.model('Shop', shopSchema);
