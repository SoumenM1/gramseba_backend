const express = require("express");
const router = express.Router();
const {
  createSubCategory,
  getSubCategoriesByCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoryController");

router.post("/", createSubCategory);
router.get("/:categoryId", getSubCategoriesByCategory);
router.put("/:id", updateSubCategory);
router.delete("/:id", deleteSubCategory);

module.exports = router;
