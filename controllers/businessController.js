const Business = require("../models/Business");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.createBusiness = async (req, res) => {
  try {
    const {
      name,
      description,
      services,
      banner,
      bannerId,
      logo,
      logoId,
      categories,
      location,
      isPublic,
    } = req.body;
    if (!name || !location) {
      return res.status(400).json({
        message: "Business name & location required",
      });
    }

    const business = await Business.create({
      name,
      description,
      services,
      banner,
      bannerId,
      logo,
      logoId,
      Category: categories,
      isPublic,
      owner: req.user._id,
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat], // [lng, lat]
      },
      address: location.text,
    });

    res.status(201).json({
      success: true,
      businessId: business._id,
      business,
    });
  } catch (err) {
    console.error("Create business error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.MyBusiness = async (req, res) => {
  try {
    const userId = req.user._id;

    const business = await Business.findOne({ owner: userId })
      .populate("Category", "name")
      .populate("owner", "name imageUrl")
      .populate("kycId");

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "You have not created any business",
      });
    }

    res.json({
      success: true,
      business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.BusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID",
      });
    }

    // 1️⃣ Get business first
    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // 2️⃣ If owner → return directly (no distance restriction)
    if (business.owner.toString() === userId) {
      const populated = await Business.findById(businessId)
        .populate("owner", "name imageUrl")
        .populate("Category");

      return res.json({
        success: true,
        data: populated,
      });
    }

    // 3️⃣ Check public
    if (!business.isPublic) {
      return res.status(403).json({
        success: false,
        message: "This business is private",
      });
    }

    // 4️⃣ Get user location
    const user = await User.findById(userId).select("location");

    if (
      !user ||
      !user.location ||
      !user.location.coordinates ||
      user.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "User location not available",
      });
    }

    const [userLng, userLat] = user.location.coordinates;

    // 5️⃣ Geo Query only for this business
    const result = await Business.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [userLng, userLat],
          },
          distanceField: "distance",
          spherical: true,
        },
      },
      {
        $match: {
          _id: new mongoose.Types.ObjectId(businessId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
    ]);

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const finalBusiness = result[0];

    // 6️⃣ Restrict 10km radius
    if (finalBusiness.distance > 10000) {
      return res.status(403).json({
        success: false,
        message: "Business is outside 10km radius",
      });
    }

    // 7️⃣ Format distance
    finalBusiness.distance =
      finalBusiness.distance < 1000
        ? `${Math.round(finalBusiness.distance)} m`
        : `${(finalBusiness.distance / 1000).toFixed(2)} km`;

    res.json({
      success: true,
      data: finalBusiness,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.nearBusiness = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, subcategory } = req.query;

    // 1️⃣ Get user location
    const user = await User.findById(userId).select("location");
    if (
      !user ||
      !user.location ||
      !user.location.coordinates ||
      user.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "User location not available",
      });
    }

    const [userLng, userLat] = user.location.coordinates;

    // 2️⃣ Build match filter
    let matchStage = {
      isPublic: true,
    };

    // If category provided → filter
    if (category) {
      matchStage.Category = new mongoose.Types.ObjectId(category);
    }

    if (subcategory) {
      matchStage.subCategory = new mongoose.Types.ObjectId(subcategory);
    }

    // 3️⃣ Aggregate
    const businesses = await Business.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [userLng, userLat], // [lng, lat]
          },
          distanceField: "distance",
          maxDistance: 10000, // 10km
          spherical: true,
        },
      },
      {
        $match: matchStage,
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "categories",
          localField: "Category",
          foreignField: "_id",
          as: "Category",
        },
      },
      {
        $project: {
          name: 1,
          banner: 1,
          rating: 1,
          followers: { $size: "$followers" },
          Category: 1,
          distance: 1,
        },
      },
    ]);

    // 4️⃣ Format distance
    const formatted = businesses.map((b) => {
      let distanceText =
        b.distance < 1000
          ? `${Math.round(b.distance)} m`
          : `${(b.distance / 1000).toFixed(2)} km`;

      return {
        ...b,
        distance: distanceText,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
