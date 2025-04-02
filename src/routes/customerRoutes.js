const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Removed `authorize`
const { addCustomer, getCustomers, getCentreSalesReport, getCustomerById, editCustomer,sseHandler, getCentreSalesReportDaily , getSalesGraphData , getCustomersByCentre } = require('../controllers/customerController');

const router = express.Router();

router.get("/sse", sseHandler);

router.get("/sales-graph", getSalesGraphData);

router.post('/add', protect, addCustomer);

router.get('/list', protect, getCustomers);

router.get('/centre-sales-report', protect, getCentreSalesReport);

router.get('/centre-sales-report-daily', protect, getCentreSalesReportDaily);
router.get('/centre/:centreId', protect, getCustomersByCentre);
router.get('/:id', protect, getCustomerById);

router.put('/:id', protect, editCustomer);



module.exports = router;
