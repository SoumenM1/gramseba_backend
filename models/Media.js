const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    mediaUrl: {
      type: String, // HLS URL (.m3u8)
      index: true,
    },
    mediaPublicId: {
      type: String,
    },

    thumbnailUrl: {
      type: String,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    mediaType: {
      type: String,
      enum: ["video", "image"],
      required: true,
    },

    stats: {
      likes: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  },
);

// Indexes for feed & profile queries
mediaSchema.index({ visibility: 1, createdAt: -1 });
mediaSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Media", mediaSchema);
