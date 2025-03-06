const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { matchCustomerVisionEntries } = require('../controllers/matchController');

const router = express.Router();

// 🔹 Match customers and vision entries
router.get('/match', protect, matchCustomerVisionEntries);

module.exports = router;
