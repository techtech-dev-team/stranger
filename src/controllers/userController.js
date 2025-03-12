const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
      if (["CM", "ARM", "Vision", "ID", "Admin"].includes(role)) {
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




// ✅ Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate("branchId centreId regionId");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving users", error: error.message });
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



// ✅ Update User
exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};

// ✅ Delete User
exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

// ✅ Mark Absent with Month-wise Attendance
exports.markAbsent = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Get the current month from the timestamp (format: YYYY-MM)
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  
      // Initialize attendance for the current month if not already present
      if (!user.monthlyAttendance.has(currentMonth)) {
        user.monthlyAttendance.set(currentMonth, {
          present: 0,
          absent: 0,
          totalWorkingDays: 26
        });
      }
  
      const attendance = user.monthlyAttendance.get(currentMonth);
  
      // Check if absent days have reached the limit for the month
      if (attendance.absent >= attendance.totalWorkingDays) {
        return res.status(400).json({ message: "Cannot mark absent. All working days already used for this month." });
      }
  
      // Increment absent count and update present accordingly
      attendance.absent += 1;
      attendance.present = attendance.totalWorkingDays - attendance.absent;
  
      // Notify Mongoose that monthlyAttendance is modified
      user.markModified("monthlyAttendance");
      await user.save();
  
      res.json({
        message: "User marked absent",
        month: currentMonth,
        attendance
      });
  
    } catch (error) {
      res.status(500).json({ message: "Error marking user absent", error: error.message });
    }
  };
  

// ✅ Get Attendance Report (Month-wise)
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
