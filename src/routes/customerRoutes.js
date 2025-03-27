const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Removed `authorize`
const { addCustomer, getCustomers, getCentreSalesReport, getCustomerById, editCustomer,sseHandler   } = require('../controllers/customerController');

const router = express.Router();

router.get("/sse", sseHandler);

router.post('/add', protect, addCustomer);

// 🔹 Any authenticated user can list customers
router.get('/list', protect, getCustomers);

router.get('/centre-sales-report', protect, getCentreSalesReport);

// Get customer by ID
router.get('/:id', protect, getCustomerById);

// Edit customer by ID
router.put('/:id', protect, editCustomer);

module.exports = router;
