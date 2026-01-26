const mongoose = require("mongoose");

const userCategoryHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    clickCount: {
      type: Number,
      default: 1,
    },
    lastClickedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserCategoryHistory", userCategoryHistorySchema);
