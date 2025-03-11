const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Staff = require('../models/User');

// Add a new customer

const addCustomer = async (req, res) => {
  try {
    const { name, number, service, duration, inTime, paymentCash1, paymentOnline1, staffAttending, paymentCash2, paymentOnline2, cashCommission, onlineCommission, outTime, branchId, centreId, regionId } = req.body;

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) return res.status(400).json({ message: 'Invalid service ID' });

    // Check if staff exists
    const userExists = await User.findById(userAttending);
    if (!userExists) return res.status(400).json({ message: 'Invalid user ID' });

    // Convert inTime and outTime to IST
    const convertToIST = (utcTime) => {
      if (!utcTime) return null;
      const date = new Date(utcTime);
      return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    };

    const newCustomer = new Customer({
      name,
      number,
      service,
      duration,
      inTime: convertToIST(inTime),
      paymentCash1,
      paymentOnline1,
      staffAttending,
      paymentCash2,
      paymentOnline2,
      cashCommission,
      onlineCommission,
      outTime: convertToIST(outTime),
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
      .populate('service') 
      .populate('staffAttending')
      .populate('branchId')
      .populate('centreId')
      .populate('regionId')
      .exec();

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



module.exports = { addCustomer, getCustomers };
