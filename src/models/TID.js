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
    tidNumbers: [
      {
        tid: {
          type: String,
          required: true,
        },
        accountName: {
          type: String,
          required: true,
        },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("TID", tidSchema);
