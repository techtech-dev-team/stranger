const mongoose = require("mongoose");

const cashCollectionSchema = new mongoose.Schema({
  centreId: { type: mongoose.Schema.Types.ObjectId, ref: "Centre", required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  amountReceived: { type: Number, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  amountReceivingDate: { type: Date, required: true },
  remark: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // Added userId field
  OT: { type: String, default: "Unverified" }, // Add this line
  RM: { type: String, default: "Unverified" }, // Add this line
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CashCollection", cashCollectionSchema);
