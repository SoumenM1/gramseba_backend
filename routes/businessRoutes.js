// routes/business.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/businessController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/create", protect, controller.createBusiness);
router.get("/me", protect, controller.MyBusiness);
router.get("/:businessId", protect, controller.BusinessById);
router.get("/", protect, controller.nearBusiness)

// router.put("/me", auth, controller.updateBusiness);

// router.get("/:id", controller.getBusinessProfile);
// router.post("/:id/follow", auth, controller.toggleFollow);

module.exports = router;
