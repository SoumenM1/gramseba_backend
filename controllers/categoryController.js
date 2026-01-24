const Category = require("../models/Category");

// CREATE
exports.createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;

    const category = await Category.create({ name, icon });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE (Soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: "Category disabled",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
