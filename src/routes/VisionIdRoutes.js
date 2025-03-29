const express = require('express');
const router = express.Router();
const { getFilteredData, updateCustomerStatus, getCustomerStatuses, getIdReport, sseHandler } = require('../controllers/VisionId');

// SSE Route for real-time updates
router.get('/sse', sseHandler);

// Fetch filtered data (customers & vision entries)
router.get("/id-report", getIdReport);
router.get('/statuses', getCustomerStatuses);

// ✅ Route to update only 'status', 'remark', and 'verified' fields
router.put('/update-status/:customerId', updateCustomerStatus);

module.exports = router;
