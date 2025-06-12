const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById,getAllUsersExceptStaff,loginArea, getClubStaffUsers,requestOtp, verifyOtpLogin,getClubStaffByCentreId ,login2,getPresentStaffByDate, registerUser, updateUser, deleteUser ,getIDUsers, getVisionUsers,login  , getAttendanceReport, getMonthlyAttendanceReport , deactivateUser , markPresent , getPresentStaffToday ,updateUserPartial} = require("../controllers/userController");

// Routes
router.post("/login/request-otp", requestOtp);
router.post("/login/verify-otp", verifyOtpLogin);
router.get("/", getAllUsers);
router.get("/all", getAllUsersExceptStaff);
router.get("/club-staff/:centreId",getClubStaffByCentreId);
router.get('/vision-users',getVisionUsers);
router.get('/id-users', getIDUsers);
router.get("/present", getPresentStaffByDate);
router.post("/register", registerUser);
router.post("/arealogin",loginArea);
router.post("/login", login);
router.post("/login2", login2);
router.get("/clubstaff", getClubStaffUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser); 
router.delete("/:id", deleteUser);
router.get("/:id/attendance", getAttendanceReport);
router.get("/:id/attendance/:month", getMonthlyAttendanceReport);
router.put("/:id/deactivate", deactivateUser);
router.put("/:id/mark-present", markPresent);
router.get("/present/today", getPresentStaffToday);
router.patch("/update/:id",updateUserPartial);
module.exports = router;
