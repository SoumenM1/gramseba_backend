const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  title: { 
    type: String, 
    // required: true 
  },
  // description: { 
  //   type: String, 
  //   // required: true 
  // },
  // price: { 
  //   type: Number, 
  //   // required: true 
  // },
  // imageUrl: { 
  //   type: String, 
  //   // required: true 
  // },
  // shop: { 
  //   type: Schema.Types.ObjectId, 
  //   ref: 'Shop',
  //   required: true 
  // },
  phone:{type:Number, require:true},
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Pre-save middleware to update the `updatedAt` field
itemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Item', itemSchema);
