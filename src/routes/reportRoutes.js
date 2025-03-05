const express = require('express');
const { getDailyReport } = require('../controllers/reportController');
const router = express.Router();

// Get Daily Financial Report
router.get('/daily-report', getDailyReport);

module.exports = router;
