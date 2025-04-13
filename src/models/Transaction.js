const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  tidNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  bankName: { type: String, required: true },
  centreId: { type: mongoose.Schema.Types.ObjectId, ref: "Centre", required: true },
  centreName: { type: String, required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
