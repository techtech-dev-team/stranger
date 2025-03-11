const express = require('express');
const { addStaff, deleteStaff, markAbsent, getAttendanceReport } = require('../controllers/staffController');

const router = express.Router();

router.post('/add', addStaff);
router.delete('/delete/:staffId', deleteStaff);
router.put('/mark-absent/:staffId', markAbsent);
router.get('/attendance-report', getAttendanceReport);

module.exports = router;
