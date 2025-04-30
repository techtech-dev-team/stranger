const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    loginId: { type: String, unique: true, sparse: true },
    pin: { type: String, sparse: true },
    role: {
      type: String,
      required: true,
      enum: ["CM", "ARM", "Vision", "ID", "BSS", "ClubStaff", "OT", "CT", "FM"],
    },
    branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    centreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Centre" }],
    regionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Region" }],
    name: { type: String, required: true },
    mobileNumber: { type: String, default: null, },
    email: { type: String, default: null,},
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    aadharOrPanNumber: {
      type: String,
      unique: true,
      default: null,
    }
,    

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

// Pre-save hook to increment present count every day if not absent
// userSchema.pre("save", function (next) {
//   const today = new Date();
//   const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
//   const currentDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

//   if (!this.monthlyAttendance.has(currentMonth)) {
//     this.monthlyAttendance.set(currentMonth, {
//       present: 0,
//       absent: 0,
//       totalWorkingDays: 26,
//       dailyRecords: new Map(),
//     });
//   }

//   const attendance = this.monthlyAttendance.get(currentMonth);

//   // Only auto-mark present if user is not already absent for today
//   if (!attendance.dailyRecords.has(currentDate)) {
//     attendance.present += 1;
//     attendance.dailyRecords.set(currentDate, { status: "Present" });
//   } else if (attendance.dailyRecords.get(currentDate).status !== "Absent") {
//     // If already present, do nothing
//     attendance.dailyRecords.set(currentDate, { status: "Present" });
//   }

//   this.markModified("monthlyAttendance");
//   next();
// });


module.exports = mongoose.model("User", userSchema);
