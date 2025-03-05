const mongoose = require("mongoose");

const centreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
});

module.exports = mongoose.model("Centre", centreSchema);
