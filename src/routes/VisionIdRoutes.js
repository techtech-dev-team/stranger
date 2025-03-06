const express = require('express');
const router = express.Router();
const { getFilteredData, updateCustomerStatus , getCustomerStatuses } = require('../controllers/VisionId');

// Fetch filtered data (customers & vision entries)


router.get('/statuses', getCustomerStatuses);

// ✅ Route to update only 'status', 'remark', and 'verified' fields
router.put('/update-status/:customerId', updateCustomerStatus);

module.exports = router;
