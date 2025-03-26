const Customer = require('../models/Customer');
const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');
const Centre = require('../models/Centre');


const addCustomer = async (req, res) => {
  try {
    const { 
      name, number, service, duration, inTime, paymentCash1, 
      paymentOnline1, staffAttending, paymentCash2, paymentOnline2, 
      cashCommission, onlineCommission, outTime, branchId, centreId, regionId 
    } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) return res.status(400).json({ message: 'Invalid service ID' });

    // Check if staff exists
    const userExists = await User.findById(staffAttending);
    if (!userExists) return res.status(400).json({ message: 'Invalid user ID' });

    // Convert UTC time to IST
    const convertToIST = (utcTime) => {
      if (!utcTime) return null;
      return new Date(new Date(utcTime).getTime() + 5.5 * 60 * 60 * 1000);
    };

    // Calculate total cash
    const totalCash = Number(paymentCash1 || 0) + Number(paymentCash2 || 0);

    // Update Centre balance
    const centre = await Centre.findById(centreId);
    if (!centre) return res.status(404).json({ message: 'Centre not found' });

    centre.balance += totalCash;
    await centre.save();

    // Create new customer
    const newCustomer = new Customer({
      name,
      number,
      service,
      duration,
      inTime: inTime,
      paymentCash1,
      paymentOnline1,
      staffAttending,
      paymentCash2,
      paymentOnline2,
      cashCommission,
      onlineCommission,
      outTime: convertToIST(outTime),
      createdBy: req.user._id,
      branchId,
      centreId,
      regionId
    });

    await newCustomer.save();
    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });

  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: 'An error occurred while adding the customer', error: error.message });
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

    let centresQuery = centreId && mongoose.isValidObjectId(centreId) ? { _id: centreId } : {};

    // Fetch all centers or specific center
    const centres = await Centre.find(centresQuery);
    if (!centres.length) {
      return res.status(404).json({ message: 'No centers found' });
    }

    let responseData = [];

    for (const centre of centres) {
      const payCriteria = centre.payCriteria; // "plus" or "minus"

      const salesReport = await Customer.aggregate([
        { $match: { centreId: centre._id } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 }, // Count the number of customers
            totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
            totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
            totalCashCommission: { $sum: "$cashCommission" },
            totalOnlineCommission: { $sum: "$onlineCommission" },
            totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } }
          }
        },
        {
          $project: {
            _id: 0,
            totalCustomers: 1,
            totalCash: 1,
            totalOnline: 1,
            totalCashCommission: 1,
            totalOnlineCommission: 1,
            totalCommission: 1,
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
        }
      ]);

      // Calculate totals for the center
      let previousBalance = centre.previousBalance;
      let balance = previousBalance;
      if (salesReport.length > 0) {
        balance += salesReport[0].grandTotal;
      }

      // Update Centre balance
      await Centre.findByIdAndUpdate(centre._id, { previousBalance, balance });

      responseData.push({
        centreId: centre._id,
        centreName: centre.name,
        centreCode: centre.centreId,
        payCriteria,
        previousBalance,
        balance,
        totalCash: salesReport[0]?.totalCash || 0,
        totalOnline: salesReport[0]?.totalOnline || 0,
        totalSales: salesReport[0]?.grandTotal || 0,
        totalCustomers: salesReport[0]?.totalCustomers || 0, // Added customer count
        salesReport
      });
    }

    res.status(200).json({
      message: 'Sales report retrieved successfully',
      data: responseData
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

const editCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(updates);
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const existingCustomer = await Customer.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const centre = await Centre.findById(existingCustomer.centreId);
    if (!centre) {
      return res.status(404).json({ message: "Centre not found" });
    }

    console.log("Centre Pay Criteria:", centre.payCriteria);

    const newPaymentCash2 = Number(updates.paymentCash2) || 0;
    const cashCommissionAmount = Number(updates.cashCommission) || 0; 

    if (centre.payCriteria === "plus") {
      console.log(`Applying PLUS logic: Adding ${newPaymentCash2} - ${cashCommissionAmount}`);
      centre.balance += newPaymentCash2 - cashCommissionAmount;
    } else {
      console.log(`Applying DEFAULT logic: Adding ${newPaymentCash2}`);
      centre.balance += newPaymentCash2;
    }

    await centre.save();

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({ message: "Customer updated successfully", customer: updatedCustomer });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { addCustomer, getCustomers, getCentreSalesReport, getCustomerById, editCustomer };