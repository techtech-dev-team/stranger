const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser , registerUser , login , markAbsent , getAttendanceReport, getMonthlyAttendanceReport , getPresentStaffByDate } = require("../controllers/userController");

// Routes
router.get("/", getAllUsers); // Get all users (Protected)
router.get("/present", getPresentStaffByDate);  // Month-wise attendanc
router.post("/register", registerUser); // Register new user
router.post("/login", login); // Login user
router.get("/:id", getUserById); // Get single user by ID (Protected)
router.put("/:id", updateUser); // Update user (Admin only)
router.delete("/:id", deleteUser); // Delete user (Admin only)
router.put("/:id/mark-absent", markAbsent);
router.get("/:id/attendance", getAttendanceReport);
router.get("/:id/attendance/:month", getMonthlyAttendanceReport);  // Month-wise attendance report



module.exports = router;
