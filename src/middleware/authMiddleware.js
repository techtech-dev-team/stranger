const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication Middleware - Protect routes
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token is present
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database and attach to request
    req.user = await User.findById(decoded._id).select("-pin");  // Exclude PIN for security

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();  // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: "Token invalid", error: error.message });
  }
};

// Admin-Only Middleware
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

module.exports = { protect, adminOnly };
