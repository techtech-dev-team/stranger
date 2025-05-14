const express = require('express');
const router = express.Router();
const adminController = require('../controllers/masterAdminController');
const masterAdminAuth = require('../middleware/adminAuth');

router.post('/login', adminController.login);

router.get('/vision-daily-report', adminController.getVisionDailyUserReport);
router.get('/id-report-user-wise', adminController.getIdReportUserWise);
module.exports = router;
