const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cookieParser = require("cookie-parser"); // ✅ Import cookie-parser

// Authentication Middleware - Protect routes
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header OR cookies
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("Decoded Token:", decoded); // ✅ Debugging log

    // Fetch user and attach to req
    req.user = await User.findById(decoded._id).select("-pin");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    console.log("Authenticated User:", req.user); // ✅ Debugging log
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid", error: error.message });
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
