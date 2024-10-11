const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const videoSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: {
    type: String, 
    required: true 
  },
  videoUrl: { 
    type: String, 
    required: true 
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  likedBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  views: { 
    type: Number, 
    default: 0 
  },
  viewedBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  shares: { 
    type: Number, 
    default: 0 
  },
  sharedBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Create and export the Video model
module.exports = mongoose.model('Video', videoSchema);
