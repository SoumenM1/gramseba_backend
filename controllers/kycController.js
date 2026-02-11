const KYC = require("../models/KYC");

// ===============================
// 1. Submit or Create KYC
// ===============================
exports.submitKYC = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      identity,
      address
    } = req.body;

    let existingKYC = await KYC.findOne({ user: userId });

    if (existingKYC && existingKYC.status === "verified") {
      return res.status(400).json({
        success: false,
        message: "KYC already verified. Cannot update."
      });
    }

    if (existingKYC) {
      existingKYC.identity = identity;
      existingKYC.address = address;
      existingKYC.status = "pending";
      existingKYC.submittedAt = new Date();
      existingKYC.rejectedReason = "";

      await existingKYC.save();

      return res.json({
        success: true,
        message: "KYC updated and submitted",
        data: existingKYC
      });
    }

    const newKYC = await KYC.create({
      user: userId,
      identity,
      address,
      status: "pending",
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "KYC submitted successfully",
      data: newKYC
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 2. Get My KYC
// ===============================
exports.getMyKYC = async (req, res) => {
  try {
    const kyc = await KYC.findOne({ user: req.user.id });

    if (!kyc) {
      return res.json({
        success: true,
        message: "KYC not found",
        data: null
      });
    }

    res.json({
      success: true,
      data: kyc
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 3. Admin - Get All KYC
// ===============================
exports.getAllKYC = async (req, res) => {
  try {
    const kycs = await KYC.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: kycs.length,
      data: kycs
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 4. Admin - Verify KYC
// ===============================
exports.verifyKYC = async (req, res) => {
  try {
    const { kycId } = req.params;

    const kyc = await KYC.findById(kycId);

    if (!kyc) {
      return res.status(404).json({ message: "KYC not found" });
    }

    kyc.status = "verified";
    kyc.verifiedAt = new Date();
    kyc.rejectedReason = "";

    await kyc.save();

    res.json({
      success: true,
      message: "KYC verified successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 5. Admin - Reject KYC
// ===============================
exports.rejectKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { reason } = req.body;

    const kyc = await KYC.findById(kycId);

    if (!kyc) {
      return res.status(404).json({ message: "KYC not found" });
    }

    kyc.status = "rejected";
    kyc.rejectedReason = reason;

    await kyc.save();

    res.json({
      success: true,
      message: "KYC rejected"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
