const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Function to generate a random 4-digit number
const generateRandom4Digit = () => Math.floor(1000 + Math.random() * 9000);

// Function to generate loginId
const generateLoginId = (role) => {
  const rolePrefix = role.slice(0, 2).toUpperCase();
  return `${rolePrefix}${generateRandom4Digit()}`;
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      mobileNumber,
      email,
      aadharOrPanNumber,
      role,
      branchIds = [],
      centreIds = [],
      regionIds = [],
      status = "Active",
    } = req.body;

    // Clean invalid ObjectIds (e.g. empty strings)
    const cleanedBranchIds = branchIds.filter(id => id);
    const cleanedCentreIds = centreIds.filter(id => id);
    const cleanedRegionIds = regionIds.filter(id => id);

    // Fix status casing (ensure it's either 'Active' or 'Inactive')
    const formattedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    let loginId = null;
    let pin = null;

    // Generate login credentials for allowed roles
    if (
      ["CM", "ARM", "Vision", "ID", "BSS", "OT", "CT", "FM"].includes(role)
    ) {
      loginId = generateLoginId(role);
      pin = generateRandom4Digit().toString();
    }

    // Enforce CM assignment rule
    if (role === "CM") {
      if (
        cleanedBranchIds.length !== 1 ||
        cleanedCentreIds.length !== 1 ||
        cleanedRegionIds.length !== 1
      ) {
        return res.status(400).json({
          message:
            "Centre Managers must be assigned exactly one branch, centre, and region.",
        });
      }
    }

    const newUser = new User({
      loginId,
      pin,
      role,
      branchIds: cleanedBranchIds,
      centreIds: cleanedCentreIds,
      regionIds: cleanedRegionIds,
      name,
      mobileNumber,
      email,
      status: formattedStatus, // Ensure the status is properly formatted
      aadharOrPanNumber:
        aadharOrPanNumber && aadharOrPanNumber.trim() !== ""
          ? aadharOrPanNumber.trim()
          : null,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Register User Error:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { loginId, pin } = req.body;

    const user = await User.findOne({ loginId });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.pin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // ✅ Include all user details in userPayload
    const userPayload = { ...user._doc }; // `_doc` contains all user fields

    // ✅ Generate JWT Token
    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,  // Prevents client-side access
      secure: process.env.NODE_ENV === "production", // Enable secure mode in production
      sameSite: "Strict"
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: userPayload,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.login2 = async (req, res) => {
  try {
    const { loginId, pin } = req.body;

    const user = await User.findOne({ loginId }).lean(); // Use .lean() to reduce overhead

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.pin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // ✅ Cleaned-up version of the user object
    const { pin: _pin, password, centres, ...safeUser } = user;

    // 🧠 Optional: if centres is huge, just map the essentials
    const safeCentres = (centres || []).map(centre => ({
      centreId: centre.centreId || centre._id,
      name: centre.name || "Unnamed",
      // Add more only if needed
    }));

    // ✅ Final payload for token (only essentials)
    const userPayload = {
      userId: user.userId,
      loginId: user.loginId,
      role: user.role,
      name: user.name, // Include user name
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict"
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        ...safeUser,
        centres: safeCentres // ⬅️ Now centres are trimmed
      },
      role: user.role
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("branchIds")
      .populate("centreIds")
      .populate("regionIds");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error: error.message });
  }
};





exports.getClubStaffUsers = async (req, res) => {
  try {
    const clubStaffUsers = await User.find({ role: "ClubStaff" })
      .populate("branchIds")
      .populate("centreIds")
      .populate("regionIds");

    if (!clubStaffUsers) {
      return res.status(404).json({ message: "No club staff users found" });
    }

    res.json(clubStaffUsers);
  } catch (error) {
    console.error("Database Query Error:", error);
    res.status(500).json({
      message: "Error retrieving club staff users",
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("branchIds")
      .populate("centreIds")
      .populate("regionIds");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchIds, centreIds: newCentreIds, regionIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    let user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });


    user.branchIds = branchIds;
    user.centreIds = newCentreIds;
    user.regionIds = regionIds;
    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// exports.markAbsent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findById(id);

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const today = new Date();
//     const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
//     const currentDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

//     // Ensure monthlyAttendance exists
//     if (!user.monthlyAttendance.has(currentMonth)) {
//       user.monthlyAttendance.set(currentMonth, {
//         present: 0,
//         absent: 0,
//         totalWorkingDays: 26,
//         dailyRecords: new Map(),
//       });
//     }

//     const attendance = user.monthlyAttendance.get(currentMonth);

//     // If the user is already absent today, do nothing
//     if (attendance.dailyRecords.has(currentDate) && attendance.dailyRecords.get(currentDate).status === "Absent") {
//       return res.status(400).json({ message: "User is already marked absent for today." });
//     }

//     // Mark user absent
//     attendance.absent += 1;
//     attendance.dailyRecords.set(currentDate, { status: "Absent" });

//     // If the user was marked present, decrease present count
//     if (attendance.present > 0) attendance.present -= 1;

//     user.markModified("monthlyAttendance");
//     await user.save();

//     res.json({
//       message: "User marked absent successfully",
//       month: currentMonth,
//       attendance,
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Error marking user absent", error: error.message });
//   }
// };


exports.getAttendanceReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { month } = req.query;
    const user = await User.findById(id).select("name role monthlyAttendance");

    if (!user) return res.status(404).json({ message: "User not found" });

    const selectedMonth = month || getCurrentMonth();
    const attendance = user.monthlyAttendance.get(selectedMonth) || { present: 0, absent: 0, totalWorkingDays: 26 };

    res.json({
      message: "Attendance report retrieved",
      user: {
        name: user.name,
        role: user.role,
        month: selectedMonth,
        attendance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving attendance report", error: error.message });
  }
};

exports.getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { id, month } = req.params; // Extract user ID and month from request

    const user = await User.findById(id).select("name role monthlyAttendance");

    if (!user) return res.status(404).json({ message: "User not found" });

    const attendance = user.monthlyAttendance.get(month);

    if (!attendance) {
      return res.status(404).json({ message: `No attendance record found for month: ${month}` });
    }

    res.json({
      message: "Monthly attendance report retrieved",
      user: {
        name: user.name,
        role: user.role,
      },
      month,
      attendance
    });

  } catch (error) {
    res.status(500).json({ message: "Error retrieving monthly attendance report", error: error.message });
  }
};

exports.getPresentStaffByDate = async (req, res) => {
  try {
    const { date, regionId, branchId, centreId } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // ✅ Build query with optional filters (convert to ObjectId if provided)
    const query = {};
    if (regionId && mongoose.isValidObjectId(regionId)) query.regionIds = regionId;
    if (branchId && mongoose.isValidObjectId(branchId)) query.branchIds = branchId;
    if (centreId && mongoose.isValidObjectId(centreId)) query.centreIds = centreId;

    // ✅ Fetch all staff based on filters
    const allStaff = await User.find(query).select("name role monthlyAttendance");

    if (!allStaff.length) {
      return res.status(404).json({ message: "No staff found for the given filters" });
    }

    // ✅ Format date as "YYYY-MM" for monthKey
    const [year, month, day] = date.split("-");
    const monthKey = `${year}-${month.padStart(2, "0")}`;

    // ✅ Filter staff who were NOT marked absent that day
    const presentStaff = allStaff.filter((user) => {
      const attendance = user.monthlyAttendance.get(monthKey);
      if (!attendance) return true; // No attendance = Present

      // Optional: If using dailyRecords in monthlyAttendance
      if (attendance.dailyRecords && attendance.dailyRecords.get(date)) {
        return attendance.dailyRecords.get(date) !== "Absent";
      }

      // If dailyRecords not used, only track monthly totals
      return attendance.absent < attendance.totalWorkingDays;
    });

    if (!presentStaff.length) {
      return res.status(404).json({ message: "No present staff found for the given filters" });
    }

    res.json({
      message: "Present staff retrieved successfully",
      date,
      presentStaff,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching present staff",
      error: error.message,
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === "Inactive") {
      return res
        .status(400)
        .json({ message: "User is already inactive" });
    }

    user.status = "Inactive";
    await user.save();

    res.json({
      message: "User status changed to Inactive successfully",
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error changing user status", error: error.message });
  }
};

exports.markPresent = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDate = today.toISOString().split("T")[0];

    if (!user.monthlyAttendance.has(currentMonth)) {
      user.monthlyAttendance.set(currentMonth, {
        present: 0,
        absent: 0,
        totalWorkingDays: 26,
        dailyRecords: new Map(),
      });
    }

    const attendance = user.monthlyAttendance.get(currentMonth);

    // Already marked Present
    if (attendance.dailyRecords.has(currentDate) && attendance.dailyRecords.get(currentDate).status === "Present") {
      return res.status(400).json({ message: "User is already marked present for today." });
    }

    // Update attendance
    attendance.present += 1;

    // If previously marked absent, adjust absent count
    if (attendance.dailyRecords.has(currentDate) && attendance.dailyRecords.get(currentDate).status === "Absent") {
      attendance.absent -= 1;
    }

    attendance.dailyRecords.set(currentDate, { status: "Present" });

    user.markModified("monthlyAttendance");
    await user.save();

    res.json({
      message: "User marked present successfully",
      month: currentMonth,
      attendance,
    });

  } catch (error) {
    res.status(500).json({ message: "Error marking user present", error: error.message });
  }
};

exports.getPresentStaffToday = async (req, res) => {
  try {
    const today = new Date();
    const date = req.query.date || today.toISOString().split("T")[0];
    const { regionId, branchId, centreId } = req.query;

    const query = {};
    if (regionId && mongoose.isValidObjectId(regionId)) query.regionIds = regionId;
    if (branchId && mongoose.isValidObjectId(branchId)) query.branchIds = branchId;
    if (centreId && mongoose.isValidObjectId(centreId)) query.centreIds = centreId;

    const allStaff = await User.find(query)
      .select("name role mobileNumber monthlyAttendance centreIds")
      .populate("centreIds", "centreId"); // Only fetch `centreId` from the `Centre` model
      
    const [year, month] = date.split("-");
    const monthKey = `${year}-${month.padStart(2, "0")}`;

    const presentStaff = allStaff.map((user) => {
      const attendance = user.monthlyAttendance.get(monthKey);
      if (!attendance) return null;

      const record = attendance.dailyRecords?.get(date);
      if (record?.status !== "Present") return null;

      return {
        _id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        centerId: user.centreIds?.[0]?.centreId || "N/A",
        status: record.status,
        inTime: record.inTime || "N/A",
        outTime: record.outTime || "N/A",
      };
    }).filter(Boolean);

    res.json({
      message: "Present staff for today retrieved successfully",
      date,
      presentStaff,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching present staff",
      error: error.message,
    });
  }
};

exports.getVisionUsers = async (req, res) => {
  try {
    const visionUsers = await User.find({ role: "Vision" })
      .populate("branchIds")
      .populate("centreIds")
      .populate("regionIds");

    res.status(200).json(visionUsers);
  } catch (error) {
    console.error("Error retrieving Vision users:", error);
    res.status(500).json({ message: "Error retrieving Vision users", error: error.message });
  }
};

exports.getIDUsers = async (req, res) => {
  try {
    const idUsers = await User.find({ role: "ID" })
      .populate("branchIds")
      .populate("centreIds")
      .populate("regionIds");

    res.status(200).json(idUsers);
  } catch (error) {
    console.error("Error retrieving ID users:", error);
    res.status(500).json({ message: "Error retrieving ID users", error: error.message });
  }
};
