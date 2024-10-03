const Video = require('../models/Video');
const socketUtil = require('../utils/socket');  // Import socket utility

// Upload video and notify all users
exports.uploadVideo = async (req, res, next) => {
  try {
    const { title, videoUrl } = req.body;

    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can upload videos' });
    }

    const video = new Video({
      title,
      videoUrl,
      seller: req.user._id
    });

    await video.save();

    // Emit the new video notification to all users
    const io = socketUtil.getIO();
    io.emit('newVideo', { title: video.title, videoUrl: video.videoUrl });

    res.status(201).json({ success: true, video });
  } catch (error) {
    next(error);
  }
};


// Get all videos sorted by date (All users)
exports.getAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.find()
      .populate('seller', 'name')
      .sort({ createdAt: -1 });  // Sort by date (newest first)
    res.status(200).json({ success: true, videos });
  } catch (error) {
    next(error);
  }
};

// Like a video
exports.likeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.likes += 1;
    await video.save();
    res.status(200).json({ success: true, likes: video.likes });
  } catch (error) {
    next(error);
  }
};

// Increment views
exports.incrementViews = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.views += 1;
    await video.save();
    res.status(200).json({ success: true, views: video.views });
  } catch (error) {
    next(error);
  }
};

// Increment shares
exports.incrementShares = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.shares += 1;
    await video.save();
    res.status(200).json({ success: true, shares: video.shares });
  } catch (error) {
    next(error);
  }
};
