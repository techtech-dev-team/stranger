const express = require('express');
const router = express.Router();
const adminController = require('../controllers/masterAdminController');
const masterAdminAuth = require('../middleware/adminAuth');

router.post('/login', adminController.login);

router.get('/vision-daily-report', masterAdminAuth, adminController.getVisionDailyUserReport);

module.exports = router;
