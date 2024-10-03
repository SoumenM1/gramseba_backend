const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { protect } = require('../middlewares/authMiddleware');

// Seller uploads a video
router.post('/upload', protect, videoController.uploadVideo);

// Get all videos sorted by date
router.get('/all', videoController.getAllVideos);

// Like a video
router.post('/:id/like', protect, videoController.likeVideo);

// Increment video views
router.post('/:id/view', videoController.incrementViews);

// Increment video shares
router.post('/:id/share', protect, videoController.incrementShares);

module.exports = router;
