const mongoose = require("mongoose");

const centreSchema = new mongoose.Schema({
  centreId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  shortCode: { type: String, required: true, unique: true },
  branchName: { type: String, required: true },
  payCriteria: {
    type: String,
    required: true,
    enum: ["plus", "minus"]
  },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
  previousBalance: { type: Number, default: 0 },
  balance: {
    type: Number,
    required: false,
    default: 0,
    validate: {
      validator: (v) => !isNaN(v) && isFinite(v),
      message: props => `${props.value} is not a valid number!`
    }
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }
});

module.exports = mongoose.model("Centre", centreSchema);
