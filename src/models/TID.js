const mongoose = require("mongoose");

const tidSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Centre",
      required: true,
    },
    centreName: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    tidNumbers: {
      type: [String], // Array of TID numbers
      required: true,
      validate: [arr => arr.length > 0, "At least one TID number is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TID", tidSchema);
