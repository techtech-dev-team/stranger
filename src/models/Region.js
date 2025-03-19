const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema({
  regionId: { type: String, required: true, unique: true }, // Unique region identifier (0001)
  name: { type: String, required: true, unique: true }, // Region name (Andhra Pradesh)
  short_code: { type: String, required: true, unique: true } // Short code (AP)
});

module.exports = mongoose.model("Region", regionSchema);
