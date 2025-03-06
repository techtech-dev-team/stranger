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
  }
});

module.exports = mongoose.model("Centre", centreSchema);
