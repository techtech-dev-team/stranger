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

router.get('/service/:serviceId', async (req, res) => {
    const { serviceId } = req.params;

    try {
        const service = await Service.findById(serviceId);
        
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Return the service details
        res.json(service);
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({ message: 'Error fetching service details' });
    }
});

module.exports = router;
