const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    loginId: { type: String, unique: true, sparse: true },
    pin: { type: String, sparse: true },
    role: {
      type: String,
      required: true,
      enum: ["CM", "ARM", "Vision", "ID", "Admin", "ClubStaff", "Manager"],
    },
    branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    centreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Centre" }],
    regionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Region" }],
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    aadharOrPanNumber: { type: String, unique: true, sparse: true },

    // Month-wise Attendance
    monthlyAttendance: {
      type: Map,
      of: {
        present: { type: Number, default: 0 },
        absent: { type: Number, default: 0 },
        totalWorkingDays: { type: Number, default: 26 },
        dailyRecords: {
          type: Map,
          of: {
            status: { type: String, enum: ["Present", "Absent"], required: true },
          },
          default: {},
        },
      },
      default: {},
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
