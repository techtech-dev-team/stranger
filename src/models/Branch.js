const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true }, // New field for branch ID
  name: { type: String, required: true, unique: true }, // Branch name (Mumbai, etc.)
  shortCode: { type: String, required: true, unique: true }, // Short code (MUM, etc.)
  regionName: { type: String, required: true }, // Region name (Maharashtra, etc.)
});

module.exports = mongoose.model("Branch", branchSchema);

