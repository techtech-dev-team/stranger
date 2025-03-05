const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Branch = require("../models/Branch"); // Import models
const Centre = require("../models/Centre");
const Region = require("../models/Region");

const generateToken = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    // Fetch user details with populated data
    const user = await User.findById(userId)
      .populate("branchId", "name")
      .populate("centreId", "name")
      .populate("regionId", "name")
      .lean();

    if (!user) {
      console.error("User not found for ID:", userId);
      throw new Error("User not found");
    }

    // Generate JWT token
    return jwt.sign(
      {
        userId: user._id,
        loginId: user.loginId,
        role: user.role,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        status: user.status,
        branch: user.branchId?.name || "Unknown",
        centre: user.centreId?.name || "Unknown",
        region: user.regionId?.name || "Unknown",
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );
  } catch (error) {
    console.error("Error generating token:", error.message);
    throw new Error("Token generation failed");
  }
};

module.exports = generateToken;
