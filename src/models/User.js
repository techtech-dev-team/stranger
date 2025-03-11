const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    loginId: { type: String, unique: true, sparse: true }, // Only generated for specific roles
    pin: { type: String, sparse: true }, // Generated only if applicable
    role: { type: String, required: true, enum: ["CM", "ARM", "Vision", "ID", "Admin", "ClubStaff", "Manager"] },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: "Centre" },
    regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region" },
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    status: { type: String, required: true, enum: ["Active", "Inactive"], default: "Active" },

    // Staff-specific fields
    aadharOrPanNumber: { type: String, unique: true, sparse: true },
    attendance: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      totalWorkingDays: { type: Number, default: 26 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
