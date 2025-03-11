const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser , registerUser , loginUser , markAbsent , getAttendanceReport } = require("../controllers/userController");

// Routes
router.get("/", getAllUsers); // Get all users (Protected)
router.get("/:id", getUserById); // Get single user by ID (Protected)
router.put("/:id", updateUser); // Update user (Admin only)
router.delete("/:id", deleteUser); // Delete user (Admin only)
router.post("/register", registerUser); // Register new user
router.post("/login", loginUser); // Login user
router.put("/:id/mark-absent", markAbsent);
router.get("/:id/attendance", getAttendanceReport);

module.exports = router;
