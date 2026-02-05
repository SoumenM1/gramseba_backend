const express = require("express");
const upload  = require("../middlewares/uploadMiddleware");
const { uploadVideo, uploadImage,startLive, getFeed } = require("../controllers/mediaController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/video", protect, upload.single("file"), uploadVideo);
router.post("/image", protect, upload.single("file"), uploadImage);
router.post("/live", protect, startLive);
router.get("/feed", protect, getFeed)
// router.get("/image-signature",  getImageUploadSignature);
// router.get("/video-signature", protect, getVideoUploadSignature);
// router.post("/save-media", protect, saveOrUpdateMedia)

module.exports = router;
