const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getRecentCategories,
  trackCategoryClick
} = require("../controllers/categoryController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/recent",protect, getRecentCategories);
router.post("/track", protect, trackCategoryClick);
router.post("/",protect, createCategory);
router.get("/", protect, getCategories);
router.put("/:id",protect, updateCategory);
router.delete("/:id",protect, deleteCategory);

module.exports = router;
