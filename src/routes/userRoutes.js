const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, getClubStaffUsers ,getPresentStaffByDate, registerUser, updateUser, deleteUser , getVisionUsers,login  , getAttendanceReport, getMonthlyAttendanceReport , deactivateUser , markPresent , getPresentStaffToday } = require("../controllers/userController");

// Routes
router.get("/", getAllUsers);
router.get('/vision-users',getVisionUsers);
router.get("/present", getPresentStaffByDate);
router.post("/register", registerUser);
router.post("/login", login);
router.get("/clubstaff", getClubStaffUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser); 
router.delete("/:id", deleteUser);
router.get("/:id/attendance", getAttendanceReport);
router.get("/:id/attendance/:month", getMonthlyAttendanceReport);
router.put("/:id/deactivate", deactivateUser);
router.put("/:id/mark-present", markPresent);
router.get("/present/today", getPresentStaffToday);
module.exports = router;
