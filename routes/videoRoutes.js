const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { protect } = require('../middlewares/authMiddleware');
const {upload} =require('../middlewares/uploadMiddleware')

// Seller uploads a video
router.post('/multimedia/upload', protect, upload.single('file'), videoController.uploadVideo);

// Get all videos sorted by date
router.get('/all', videoController.getAllVideos);

// Like a video
router.post('/:id/like', protect, videoController.likeVideo);

// Increment video views
router.post('/:id/view', videoController.incrementViews);

// Increment video shares
router.post('/:id/share', protect, videoController.incrementShares);

//multimedia features 
// Get all video IDs
router.get('/multimedia', protect, videoController.getAllVideoIds);

// Update video title and description
router.put('/multimedia/:id', protect, videoController.updateVideo);

// Delete video by ID
router.delete('/multimedia/:id', protect, videoController.deleteVideo);


module.exports = router;
