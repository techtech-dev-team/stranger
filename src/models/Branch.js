const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
});

module.exports = mongoose.model("Branch", branchSchema);
