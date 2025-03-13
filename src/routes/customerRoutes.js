const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Removed `authorize`
const { addCustomer, getCustomers, getCentreSalesReport } = require('../controllers/customerController');

const router = express.Router();

// 🔹 Any authenticated user can add customers
router.post('/add', protect, addCustomer);

// 🔹 Any authenticated user can list customers
router.get('/list', protect, getCustomers);

router.get('/centre-sales-report', protect, getCentreSalesReport);

module.exports = router;
