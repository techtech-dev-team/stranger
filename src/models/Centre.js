const mongoose = require("mongoose");

const centreSchema = new mongoose.Schema({
  centreId: { type: String, required: true, unique: true }, // Unique centre ID (001_MH_MUM_TS)
  name: { type: String, required: true, unique: true }, // Centre name (Tranquil Spa)
  shortCode: { type: String, required: true, unique: true }, // Short code (TS)
  branchName: { type: String, required: true }, // Branch name (Mumbai)
  payCriteria: { 
    type: String, 
    required: true, 
    enum: ["plus", "minus"] // Payment criteria validation
  },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // Reference to Branch
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true }  // Reference to Region
});

module.exports = mongoose.model("Centre", centreSchema);
