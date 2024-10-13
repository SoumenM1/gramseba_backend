const Video = require("../models/Video");
const socketUtil = require("../utils/socket"); // Import socket utility
// const videoIntelligence = require('@google-cloud/video-intelligence');
const cloudinary = require("../config/cloudinaryConfig").cloudinary;
const fs = require("fs");
const path = require("path");

// Initialize the Video Intelligence client
// const client = new videoIntelligence.VideoIntelligenceServiceClient();

// async function checkVideoContent(videoUrl) {
//   try {
//     const request = {
//       inputUri: videoUrl,  // The URL of the video to check
//       features: ['EXPLICIT_CONTENT_DETECTION'],
//     };

//     // Perform video moderation analysis
//     const [operation] = await client.annotateVideo(request);
//     const [operationResult] = await operation.promise();

//     const explicitContentResults = operationResult.annotationResults[0].explicitAnnotation;

//     // Loop through the results and check for explicit content
//     for (const frame of explicitContentResults.frames) {
//       const timeOffset = (frame.timeOffset.seconds || 0) + (frame.timeOffset.nanos || 0) / 1e9;
//       const pornographyLikelihood = frame.pornographyLikelihood;

//       if (pornographyLikelihood >= 3) { // 3 is the threshold for 'LIKELY'
//         return { success: false, message: `Explicit content detected at ${timeOffset}s` };
//       }
//     }
//     return { success: true, message: 'No explicit content detected' };
//   } catch (error) {
//     console.error('Error checking video content:', error);
//     return { success: false, message: 'Error checking video content' };
//   }
// }
// Helper function to check for prohibited content
function containsProhibitedContent(text) {
  const prohibitedPatterns = [/violence/i, /sexual/i, /abuse/i, /offensive/i];

  // Check for any prohibited words/phrases in the text
  return prohibitedPatterns.some((pattern) => pattern.test(text));
}

exports.uploadVideo = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const mediaFile = req.file; // Assuming you're using multer for file uploads

    // Ensure only sellers can upload media
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can upload media" });
    }

    // Validate required fields
    if (!title || !description || !mediaFile) {
      return res
        .status(400)
        .json({ message: "Title, description, and media file are required" });
    }

    // Check for prohibited content in title or description
    if (
      containsProhibitedContent(title) ||
      containsProhibitedContent(description)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Your content violates our privacy policies. Please remove any prohibited content.",
      });
    }

    // Determine the file type (image or video) based on MIME type
    const mimeType = mediaFile.mimetype;
    let isVideo = false;
    let mediaUrl = "";
    const uploadPath = path.join(__dirname, `../uploads/${mediaFile.filename}`);

    if (mimeType.startsWith("video/")) {
      // Handle video upload with optimization
      isVideo = true;
      const uploadResult = await cloudinary.uploader.upload(uploadPath, {
        resource_type: "video",
        folder: "videos",
        // Cloudinary transformation options for video optimization
        quality: "auto:best", // Automatic best quality
        fetch_format: "auto", // Automatic format selection (e.g., WebM for smaller size)
        bit_rate: "500k", // Adjust the bit rate for lower size
        width: 720, // Resize the video to 720p width
      });
      mediaUrl = uploadResult.secure_url;
    } else if (mimeType.startsWith("image/")) {
      // Handle image upload with optimization
      const uploadResult = await cloudinary.uploader.upload(uploadPath, {
        resource_type: "image",
        folder: "images",
        // Cloudinary transformation options for image optimization
        quality: "auto:best", // Automatic best quality compression
        fetch_format: "auto", // Automatic format selection (e.g., WebP for smaller size)
        width: 800, // Resize the image to a max width of 800px
        crop: "limit", // Ensure no upscaling and limit the resizing
      });
      mediaUrl = uploadResult.secure_url;
    } else {
      // Unsupported file type
      return res
        .status(400)
        .json({
          message: "Unsupported file type. Please upload an image or video.",
        });
    }

    // Create a new media instance
    const media = new Video({
      title,
      description,
      videoUrl: isVideo ? mediaUrl : undefined,
      imageUrl: !isVideo ? mediaUrl : undefined,
      isVideo,
      seller: req.user._id,
    });

    // Save the media to the database
    await media.save();

    // Notify all users about the new media using Socket.IO
    const io = socketUtil.getIO();
    io.emit("newMedia", {
      title: media.title,
      mediaUrl: mediaUrl,
      isVideo: media.isVideo,
    });

    // Delete the local file after uploading to Cloudinary
    fs.unlinkSync(uploadPath);

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Media uploaded and optimized successfully",
      media,
    });
  } catch (error) {
    console.error("Error uploading media:", error);

    // Delete local file if any error occurs
    if (req.file && fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    next(error); // Pass the error to the global error handler
  }
};

// Get all videos sorted by date (All users)
exports.getAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.find()
      .populate({
        path: "seller",
        select: "name imageUrl", // Use space to separate the fields
      })
      .sort({ createdAt: -1 }); // Sort by date (newest first)
    res.status(200).json({ success: true, videos });
  } catch (error) {
    next(error);
  }
};

exports.likeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if the user has already liked the video
    const userId = req.user._id; // Get user ID from the authenticated user
    if (video.likedBy.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already liked this video" });
    }

    // Increase the like count and add the user to likedBy array
    video.likes += 1;
    video.likedBy.push(userId);
    await video.save();

    res.status(200).json({
      success: true,
      message: "Video liked successfully",
      likes: video.likes,
    });
  } catch (error) {
    next(error);
  }
};

// Increment views only once per user
exports.incrementViews = async (req, res, next) => {
  try {
    const userId = req.user._id; // Assuming user ID is coming from the authenticated token
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if the user has already viewed the video
    const hasViewed = video.viewedBy.includes(userId);

    if (!hasViewed) {
      // Increment the views and add the user to the viewedBy array
      video.views += 1;
      video.viewedBy.push(userId);
      await video.save();
    }

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
      return res.status(404).json({ message: "Video not found" });
    }

    video.shares += 1;
    await video.save();
    res.status(200).json({ success: true, shares: video.shares });
  } catch (error) {
    next(error);
  }
};

// Get all video IDs (only IDs)
exports.getAllVideoIds = async (req, res, next) => {
  try {
    const videos = await Video.find({ seller: req.user._id });
    res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    next(error);
  }
};

// Update video title and description
exports.updateVideo = async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const video = await Video.findOneAndUpdate(
      { _id: id, seller: req.user._id }, // Ensure the user can only update their own videos
      { title, description },
      { new: true }
    );

    if (!video) {
      return res
        .status(404)
        .json({ message: "Video not found or not authorized" });
    }

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      video,
    });
  } catch (error) {
    next(error);
  }
};

// Delete video by ID
exports.deleteVideo = async (req, res, next) => {
  const { id } = req.params;

  try {
    const video = await Video.findOne({ _id: id, seller: req.user._id });
    if (!video) {
      return res
        .status(404)
        .json({ message: "Video not found or not authorized" });
    }

    // Delete video from Cloudinary (assuming videoUrl is stored in Cloudinary)
    const publicId = video.videoUrl.split("/").pop().split(".")[0]; // Extract public ID from URL
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

    // Delete video from MongoDB
    await Video.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
