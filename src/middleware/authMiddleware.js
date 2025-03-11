const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-pin"); // Exclude PIN
        if (!req.user) return res.status(401).json({ message: "User not found" });
        next();
    } catch (error) {
        res.status(401).json({ message: "Token invalid" });
    }
};

// Admin-Only Middleware
exports.adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};
