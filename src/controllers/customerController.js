const Customer = require('../models/Customer');
const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');
const Centre = require('../models/Centre');


const addCustomer = async (req, res) => {
  try {
    const { name, number, service, duration, inTime, paymentCash1, paymentOnline1, staffAttending, paymentCash2, paymentOnline2, cashCommission, onlineCommission, outTime, branchId, centreId, regionId } = req.body;

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) return res.status(400).json({ message: 'Invalid service ID' });

    // Check if staff exists
    const userExists = await User.findById(staffAttending);
    if (!userExists) return res.status(400).json({ message: 'Invalid user ID' });

    // Convert inTime and outTime to IST
    const convertToIST = (utcTime) => {
      if (!utcTime) return null;
      const date = new Date(utcTime);
      return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    };

    // Calculate total cash
    const totalCash = (paymentCash1 || 0) + (paymentCash2 || 0);

    // Update Centre balance
    const centre = await Centre.findById(centreId);
    if (!centre) return res.status(404).json({ message: 'Centre not found' });

    centre.balance += totalCash;
    await centre.save();

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


const getCentreSalesReport = async (req, res) => {
  try {
    const { centreId } = req.query;

    if (!centreId || !mongoose.isValidObjectId(centreId)) {
      return res.status(400).json({ message: 'Valid centreId is required' });
    }

    // Fetch Centre and Pay Criteria
    const centre = await Centre.findById(centreId);
    if (!centre) {
      return res.status(404).json({ message: 'Centre not found' });
    }

    const payCriteria = centre.payCriteria; // "plus" or "minus"

    // Fetch sales data
    const salesReport = await Customer.aggregate([
      { $match: { centreId: new mongoose.Types.ObjectId(centreId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$inTime" } },
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalCashCommission: { $sum: "$cashCommission" },
          totalOnlineCommission: { $sum: "$onlineCommission" },
          totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } } // New field
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalCash: 1,
          totalOnline: 1,
          totalCashCommission: 1,
          totalOnlineCommission: 1,
          totalCommission: 1, // Include in response
          grandTotal: {
            $cond: {
              if: { $eq: [payCriteria, "plus"] },
              then: {    
                $subtract: [
                  { $add: ["$totalCash", "$totalOnline"] },
                  "$totalCommission"
                ]
              },
              else: { $add: ["$totalCash", "$totalOnline"] }
            }
          },
          balance: {
            $cond: {
              if: { $eq: [payCriteria, "plus"] },
              then: { $subtract: ["$totalCash", "$totalCashCommission"] },
              else: "$totalCash"
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Calculate Overall Totals
    let previousBalance = centre.previousBalance;
    let balance = previousBalance;

    salesReport.forEach(entry => {
      balance += entry.grandTotal;
    });

    // Update Centre with New Balances
    await Centre.findByIdAndUpdate(centreId, {
      previousBalance,
      balance
    });

    res.status(200).json({
      message: 'Centre sales report retrieved successfully',
      centreId,
      payCriteria,
      previousBalance,
      balance,
      salesReport
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const customer = await Customer.findById(id)
      .populate('service')
      .populate('staffAttending')
      .populate('branchId')
      .populate('centreId')
      .populate('regionId');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Edit customer by ID
const editCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    if (updates.inTime) updates.inTime = convertToIST(updates.inTime);
    if (updates.outTime) updates.outTime = convertToIST(updates.outTime);

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ message: 'Customer updated successfully', customer: updatedCustomer });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { addCustomer, getCustomers, getCentreSalesReport, getCustomerById, editCustomer };