const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kycController");
const { protect, admin } = require("../middlewares/authMiddleware");

// User routes
router.post("/submit", protect, kycController.submitKYC);
router.get("/me", protect, kycController.getMyKYC);

// Admin routes
// router.get("/all", protect, admin, kycController.getAllKYC);
// router.put("/verify/:kycId", protect, admin, kycController.verifyKYC);
// router.put("/reject/:kycId", protect, admin, kycController.rejectKYC);

module.exports = router;
