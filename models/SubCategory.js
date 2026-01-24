const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate subcategory under same category
subCategorySchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("SubCategory", subCategorySchema);
