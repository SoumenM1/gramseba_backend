const express = require("express");
const { createMedia,startLive, getFeed } = require("../controllers/mediaController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", protect, createMedia);
router.post("/live", protect, startLive);
router.get("/feed", protect, getFeed)
// router.get("/image-signature",  getImageUploadSignature);
// router.get("/video-signature", protect, getVideoUploadSignature);
// router.post("/save-media", protect, saveOrUpdateMedia)

module.exports = router;
