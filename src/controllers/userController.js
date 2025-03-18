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
      role,
      branchIds,
      centreIds,
      regionIds,
      status,
    } = req.body;

    // Check if user with the same mobile number or email already exists
    const existingUser = await User.findOne({
      $or: [{ mobileNumber }, { email }],
    });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    let loginId = null;
    let pin = null;

    // Only generate loginId & PIN for specific roles
    if (["CM", "ARM", "Vision", "ID", "Admin", "ClubStaff"].includes(role)) {
      loginId = generateLoginId(role);
      pin = generateRandom4Digit().toString();
    }

    const newUser = new User({
      name,
      mobileNumber,
      email,
      role,
      branchIds,
      centreIds,
      regionIds,
      status,
      loginId,
      pin,
    });

    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

// ✅ Login User
// ✅ Login User
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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("branchIds") // Populate multiple branch IDs
      .populate("centreIds") // Populate multiple centre IDs
      .populate("regionIds"); // Populate multiple region IDs

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving users",
      error: error.message,
    });
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
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
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

exports.markAbsent = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    const currentDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Ensure monthlyAttendance exists
    if (!user.monthlyAttendance[currentMonth]) {
      user.monthlyAttendance[currentMonth] = {
        present: 0,
        absent: 0,
        totalWorkingDays: 26,
        dailyRecords: {}, // Changed from Map to object for Mongoose compatibility
      };
    }

    const attendance = user.monthlyAttendance[currentMonth];

    // Check if the user is already marked absent today
    if (attendance.dailyRecords[currentDate]?.status === "Absent") {
      return res.status(400).json({ message: "User is already marked absent for today." });
    }

    // Mark absent
    attendance.absent += 1;
    attendance.dailyRecords[currentDate] = { status: "Absent" };

    // Decrease present count if applicable
    if (attendance.present > 0) attendance.present -= 1;

    // Notify Mongoose of the modified structure
    user.markModified("monthlyAttendance");
    await user.save();

    res.json({
      message: "User marked absent successfully",
      month: currentMonth,
      attendance,
    });

  } catch (error) {
    res.status(500).json({ message: "Error marking user absent", error: error.message });
  }
};


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