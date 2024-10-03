const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  description: { type: String, required: true },
  location: { 
    type: { type: String, default: 'Point' },
    coordinates: [Number]  // [longitude, latitude]
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }, // Only accessible by certain organizations
  createdAt: { type: Date, default: Date.now }
});

offerSchema.index({ location: '2dsphere' });  // For geospatial queries

module.exports = mongoose.model('Offer', offerSchema);
