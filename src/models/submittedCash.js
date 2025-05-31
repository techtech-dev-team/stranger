const mongoose = require("mongoose");

const submittedCashSchema = new mongoose.Schema({
  amountPaid: { type: Number, required: true }, // Amount paid
  dateSubmitted: { type: Date, required: true }, // Date of submission
  submittedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Refers to the user to whom the cash was submitted
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who submitted the cash
  isVerified: { type: Boolean, default: false }, // Verification status
  remark: { type: String, default: "" }, // Optional remark
  createdAt: { type: Date, default: Date.now }, // Record creation date
});

module.exports = mongoose.model("SubmittedCash", submittedCashSchema);