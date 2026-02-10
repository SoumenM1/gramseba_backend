const Category = require("../models/Category");
const UserCategoryHistory = require("../models/CategoryHistory");

exports.getRecentCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    let recent = await UserCategoryHistory.find({ user: userId })
      .sort({ lastClickedAt: -1 })
      .limit(6)
      .populate("category");
    // 🟡 If user has no history
    if (recent.length === 0) {
      const fallback = await Category.find({ isActive: true })
        .sort({ createdAt: -1 }) 
        .limit(10)

      return res.status(200).json({
        source: "default",
        categories: fallback,
      });
    }
    const categories = recent.map((r) => r.category);
    return res.status(200).json({
      source: "recent",
      categories,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch recent categories." });
  }
};

const MAX_HISTORY = 6;

exports.trackCategoryClick = async (req, res) => {
  try {
  const userId = req.user.id;
  const { categoryId } = req.body;
  if (!categoryId) {
    return res.status(400).json({ message: "categoryId is required." });
  }
  let record = await UserCategoryHistory.findOne({
    user: userId,
    category: categoryId,
  });

  if (record) {
    record.clickCount += 1;
    record.lastClickedAt = new Date();
    await record.save();
  } else {
    await UserCategoryHistory.create({
      user: userId,
      category: categoryId,
      clickCount: 1,
      lastClickedAt: new Date(),
    });
  }

  // 🔥 Cleanup: keep only last 20 per user
  const total = await UserCategoryHistory.countDocuments({ user: userId });

  if (total > MAX_HISTORY) {
    const oldRecords = await UserCategoryHistory.find({ user: userId })
      .sort({ lastClickedAt: 1 }) // oldest first
      .limit(total - MAX_HISTORY);

    const oldIds = oldRecords.map((r) => r._id);

    await UserCategoryHistory.deleteMany({ _id: { $in: oldIds } });
  }

  return res.status(200).json({ message: "Tracked & cleaned" });
} catch (error) {
  return res
    .status(500)
    .json({ message: "Failed to track category click." });
}}

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
      categories,
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
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

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
