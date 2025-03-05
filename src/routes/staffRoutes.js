const express = require('express');
const { addStaff, deleteStaff, markAbsent, getAttendanceReport } = require('../controllers/staffController');

const router = express.Router();

router.post('/add', addStaff); // Add new staff
router.delete('/delete/:staffId', deleteStaff); // Delete staff
router.put('/mark-absent/:staffId', markAbsent); // Mark absent
router.get('/attendance-report', getAttendanceReport); // Get attendance report

module.exports = router;
