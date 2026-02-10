// routes/kyc.routes.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/kyc.controller");

router.post("/", auth, controller.submitKYC);

// 🔒 Admin only (add admin middleware later)
router.put("/:id/verify", controller.verifyKYC);

module.exports = router;
