const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Branch name (e.g., Mumbai)
  shortCode: { type: String, required: true, unique: true }, // Short code (e.g., MUM)
  regionName: { type: String, required: true }, // Region name (e.g., Maharashtra)
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true }, // Reference to Region model
});

module.exports = mongoose.model("Branch", branchSchema);
