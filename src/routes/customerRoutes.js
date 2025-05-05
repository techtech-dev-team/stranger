const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Removed `authorize`
const {getDashboardBlocks, addCustomer,deleteCustomer,getMonthlyCollectionAndExpenses,getCustomersByCentreAndDate, getCustomers,getCentreReportByDate,getCustomersFast, getCentreSalesReport, getFilteredCustomers, getCustomerById, editCustomer,sseHandler, getCentreSalesReportDaily , getSalesGraphData , getCustomersByCentre, updateCustomer } = require('../controllers/customerController');

const router = express.Router();

router.get("/sse", sseHandler);

router.get("/dashboard-blocks", getDashboardBlocks);

router.get("/fast-list", getCustomersFast); 

router.get("/sales-graph", getSalesGraphData);

router.get('/:centreId/date',getCustomersByCentreAndDate);

router.post('/add', protect, addCustomer);

router.delete('/:id', deleteCustomer);

router.get('/list', protect, getCustomers);

router.get('/:centreId/recent-customers', getCentreReportByDate);

router.get('/monthly-collection-expenses', getMonthlyCollectionAndExpenses);

router.get('/filtered-customers', getFilteredCustomers);

router.get('/centre-sales-report', protect, getCentreSalesReport);

router.get('/centre-sales-report-daily', protect, getCentreSalesReportDaily);

router.get('/centre/:centreId', protect, getCustomersByCentre);

router.put('/:id', editCustomer);

router.put('/update/:id', protect, updateCustomer);

router.get('/:id', protect, getCustomerById);





module.exports = router;
