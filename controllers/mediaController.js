const fs = require("fs");
const cloudinary = require("../config/cloudinaryConfig").cloudinary;
const Media = require("../models/Media");

exports.createMedia = async (req, res) => {
  try {
    const {
      title,
      description,
      mediaUrl,
      mediaPublicId,
      mediaType,      // "image" | "video"
      thumbnailUrl,   // optional (video)
    } = req.body;

    // 🔴 Basic validation
    if (!mediaUrl || !mediaPublicId || !mediaType) {
      return res.status(400).json({
        message: "mediaUrl, mediaPublicId and mediaType are required",
      });
    }

    if (!["image", "video"].includes(mediaType)) {
      return res.status(400).json({ message: "Invalid media type" });
    }

    // 🔐 Security check (important)
    if (!mediaUrl.includes("res.cloudinary.com")) {
      return res.status(400).json({ message: "Invalid media source" });
    }

    // 📦 Common payload
    const payload = {
      title,
      description,
      mediaUrl,
      mediaPublicId,
      mediaType,
      user: req.user._id,
      visibility: "public",
    };

    // 🎥 Video-only fields
    if (mediaType === "video") {
      payload.thumbnailUrl = thumbnailUrl || null;
    }

    // 💾 Save media
    const media = await Media.create(payload);

    return res.status(201).json({
      success: true,
      message: `${mediaType} uploaded successfully`,
      media,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const cursor = req.query.cursor;

    const query = { visibility: "public" };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const items = await Media.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("user", "name imageUrl")
      .lean();

    let nextCursor = null;

    if (items.length > limit) {
      nextCursor = items[limit - 1].createdAt;
      items.pop();
    }

    res.json({
      success: true,
      data: items,
      nextCursor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.startLive = async (req, res) => {
  try {
    const stream = await cloudinary.uploader.upload("", {
      resource_type: "video",
      type: "upload",
      live: true,
      recording: false, // 🚫 NOT SAVED
    });

    res.json({
      streamKey: stream.public_id,
      rtmpUrl: stream.upload_url,
      playbackUrl: stream.secure_url, // HLS
    });
  } catch (err) {
    res.status(500).json({ message: "Live start failed" });
  }
};

