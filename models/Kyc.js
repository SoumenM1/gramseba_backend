const kycSchema = new mongoose.Schema(
  {
    identity: {
      docType: {
        type: String,
        enum: ["aadhaar", "pan", "passport", "voter_id"],
      },
      docNumber: String,
      frontImage: String,
      backImage: String,
    },

    address: {
      docType: {
        type: String,
        enum: [
          "aadhaar",
          "electricity_bill",
          "bank_statement",
          "rent_agreement",
        ],
      },
      docNumber: String,
      documentImage: String,
    },

    status: {
      type: String,
      enum: ["not_submitted", "pending", "verified", "rejected"],
      default: "not_submitted",
    },

    rejectedReason: String,

    submittedAt: Date,
    verifiedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("KYC", kycSchema);
