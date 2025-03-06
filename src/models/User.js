const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  loginId: { type: String, required: true, unique: true, minlength: 6, maxlength: 20 }, // Auto-generated
  pin: { type: String, required: true }, // Auto-generated 4-digit PIN
  role: { type: String, required: true, enum: ["CM", "ARM", "Vision", "ID", "Admin"] },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  centreId: { type: mongoose.Schema.Types.ObjectId, ref: "Centre", required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  status: { type: String, required: true, enum: ["Active", "Inactive"] },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);