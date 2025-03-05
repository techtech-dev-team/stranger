const express = require('express');
const { addService, getServices, editService, deleteService } = require('../controllers/serviceController');

const router = express.Router();

// ✅ Add a new service
router.post('/add', addService);

// ✅ Get all services
router.get('/list', getServices);

// ✅ Edit a service
router.put('/edit/:serviceId', editService);

// ✅ Delete a service
router.delete('/delete/:serviceId', deleteService);

module.exports = router;
