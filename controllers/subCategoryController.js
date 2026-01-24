const SubCategory = require("../models/SubCategory");

// CREATE
exports.createSubCategory = async (req, res) => {
  try {
    const { name, category } = req.body;

    const subCategory = await SubCategory.create({
      name,
      category,
    });

    res.status(201).json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET by Category
exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const subCategories = await SubCategory.find({
      category: req.params.categoryId,
      isActive: true,
    }).populate("category", "name");

    res.json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
exports.updateSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE (Soft delete)
exports.deleteSubCategory = async (req, res) => {
  try {
    await SubCategory.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: "SubCategory disabled",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
