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
    unique: true, 
    sparse: true 
  },
  imageUrl: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  isvideo:{type:Boolean,require:true},
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

// Pre-save middleware to update the `updatedAt` field automatically
videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add an index for performance on frequently queried fields (e.g., sorting, filtering)
videoSchema.index({ seller: 1 });
videoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
