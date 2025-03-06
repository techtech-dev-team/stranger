const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Staff = require('../models/Staff');

// Add a new customer
const addCustomer = async (req, res) => {
  try {
    const { name, number, service, duration, inTime, paymentCash1, paymentOnline1, staffAttending, paymentCash2, paymentOnline2, cashCommission, onlineCommission, outTime, branchId, centreId, regionId } = req.body;

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) return res.status(400).json({ message: 'Invalid service ID' });

    // Check if staff exists
    const staffExists = await Staff.findById(staffAttending);
    if (!staffExists) return res.status(400).json({ message: 'Invalid staff ID' });

    // Create new customer entry
    const newCustomer = new Customer({
      name,
      number,
      service,
      duration,
      inTime,
      paymentCash1,
      paymentOnline1,
      staffAttending,
      paymentCash2,
      paymentOnline2,
      cashCommission,
      onlineCommission,
      outTime,
      createdBy: req.user._id, // Centre Manager who added this customer
      branchId,
      centreId,
      regionId
    });

    await newCustomer.save();
    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all customers added by Centre Manager
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate('service', 'name') // Populate service details
      .populate('staffAttending', 'name') // Populate staff details
      .populate('branchId', 'name') // Populate branch details
      .populate('centreId', 'name') // Populate centre details
      .populate('regionId', 'name'); // Populate region details

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { addCustomer, getCustomers };
