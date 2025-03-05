const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Removed `authorize`
const { addCustomer, getCustomers } = require('../controllers/customerController');

const router = express.Router();

// 🔹 Any authenticated user can add customers
router.post('/add', protect, addCustomer);

// 🔹 Any authenticated user can list customers
router.get('/list', protect, getCustomers);

module.exports = router;
