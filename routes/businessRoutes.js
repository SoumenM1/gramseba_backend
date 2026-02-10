// routes/business.routes.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/business.controller");

router.post("/", auth, controller.createBusiness);
router.get("/me", auth, controller.getMyBusiness);
router.put("/me", auth, controller.updateBusiness);

router.get("/:id", controller.getBusinessProfile);
router.post("/:id/follow", auth, controller.toggleFollow);

module.exports = router;
