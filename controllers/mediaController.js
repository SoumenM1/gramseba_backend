const fs = require("fs");
const cloudinary = require("../config/cloudinaryConfig").cloudinary;
const Media = require("../models/Media");

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    // ☁️ Upload to Cloudinary (HLS)
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "gram_bazer/videos",
      resource_type: "video",
      eager: [
        {
          streaming_profile: "hd",
          format: "m3u8",
        },
      ],
      eager_async: true,
    });

    // 🧹 Delete local file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("File cleanup error:", err);
    });

    // 💾 Save media record
    const media = await Media.create({
      title: req.body.title,
      description: req.body.description,
      mediaUrl: result.eager?.[0]?.secure_url, // HLS URL
      mediaPublicId: result.public_id,
      thumbnailUrl: result.secure_url.replace(".mp4", ".jpg"), // optional
      mediaType: "video",
      user: req.user.id,
      visibility: "public",
    });

    return res.status(201).json({
      success: true,
      message: "video upload",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "gram_bazer/images",
      resource_type: "image",
      transformation: [
        { width: 1080, height: 1080, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("File cleanup error:", err);
    });

    const media = await Media.create({
      title: req.body.title,
      description: req.body.description,
      mediaUrl: result.secure_url,
      mediaPublicId: result.public_id,
      mediaType: "image",
      user: req.user.id,
      visibility: "public",
    });

    return res.status(201).json({ success: true, message: "image upload" });
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

