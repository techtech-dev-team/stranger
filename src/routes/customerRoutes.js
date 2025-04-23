const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Removed `authorize`
const {getDashboardBlocks, addCustomer, getCustomers,getCustomersFast, getCentreSalesReport, getFilteredCustomers, getCustomerById, editCustomer,sseHandler, getCentreSalesReportDaily , getSalesGraphData , getCustomersByCentre, updateCustomer } = require('../controllers/customerController');

const router = express.Router();

router.get("/sse", sseHandler);

router.get("/dashboard-blocks", getDashboardBlocks);
router.get("/fast-list", getCustomersFast); 
router.get("/sales-graph", getSalesGraphData);

router.post('/add', protect, addCustomer);

router.get('/list', protect, getCustomers);

router.get('/filtered-customers', getFilteredCustomers);

router.get('/centre-sales-report', protect, getCentreSalesReport);

router.get('/centre-sales-report-daily', protect, getCentreSalesReportDaily);

router.get('/centre/:centreId', protect, getCustomersByCentre);

router.put('/:id', protect, editCustomer);

router.put('/update/:id', protect, updateCustomer);

router.get('/:id', protect, getCustomerById);





module.exports = router;
