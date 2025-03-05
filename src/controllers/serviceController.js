const Service = require('../models/Service');

// ✅ Add a new service
const addService = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: 'Service name is required' });

    const existingService = await Service.findOne({ name });
    if (existingService) return res.status(400).json({ message: 'Service already exists' });

    const newService = new Service({ name });
    await newService.save();

    res.status(201).json({ message: 'Service added successfully', service: newService });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get all services
const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Edit service (Update service name)
const editService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: 'Service name is required' });

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedService) return res.status(404).json({ message: 'Service not found' });

    res.status(200).json({ message: 'Service updated successfully', service: updatedService });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Delete service
const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const deletedService = await Service.findByIdAndDelete(serviceId);

    if (!deletedService) return res.status(404).json({ message: 'Service not found' });

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { addService, getServices, editService, deleteService };
