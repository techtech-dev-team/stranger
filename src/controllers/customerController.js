const Customer = require('../models/Customer');
const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');
const Centre = require('../models/Centre');
const { login } = require('./userController');
const clients = []; // Store SSE clients
const moment = require('moment-timezone');

const addCustomer = async (req, res) => {
  try {
    const {
      name, number, service, duration, inTime, paymentCash1,
      paymentOnline1, staffAttending, paymentCash2, paymentOnline2,
      cashCommission, onlineCommission, outTime, branchId, centreId, regionId
    } = req.body;

    console.log("Body", req.body);
    
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
    const totalCash = Number(paymentCash1 || 0) + Number(paymentOnline1 || 0);

    // Update Centre balance
    const centre = await Centre.findById(centreId);
    if (!centre) return res.status(404).json({ message: 'Centre not found' });

    let balanceUpdate = 0;

    if (centre.payCriteria === "plus") {
      balanceUpdate = Number(paymentCash1 || 0) + Number(paymentOnline1 || 0);
    } else if (centre.payCriteria === "minus") {
      balanceUpdate = Number(paymentCash1 || 0) + Number(paymentOnline1 || 0);
    }

    centre.balance += balanceUpdate;
    await centre.save();

    // Create new customer
    const newCustomer = new Customer({
      name,
      number,
      service,
      duration,
      inTime: moment.tz(inTime, "MM/DD/YYYY, hh:mm:ss A", "Asia/Kolkata").toDate(), // Convert to IST
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
    console.log("New newCustomer", newCustomer);
    
    // Fetch the customer with populated references
    const populatedCustomer = await Customer.findById(newCustomer._id)
      .populate('service')
      .populate('staffAttending')
      .populate('branchId')
      .populate('centreId')
      .populate('regionId')
      .exec();

    sendSSEEvent({ message: "New customer added", customer: populatedCustomer });

    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });

  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: 'An error occurred while adding the customer', error: error.message });
  }
};
const sendSSEEvent = (data) => {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

const sseHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push({ res });

  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  });
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

    let centresQuery = centreId && mongoose.Types.ObjectId.isValid(centreId) ? { _id: centreId } : {};

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
      let balance = centre.previousBalance + centre.balance;

      responseData.push({
        centreId: centre._id,
        centreName: centre.name,
        centreCode: centre.centreId,
        payCriteria,
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
const getSalesGraphData = async (req, res) => {
  try {
    const { centreId } = req.query;

    // Validate centre ID if provided
    if (centreId && !mongoose.isValidObjectId(centreId)) {
      return res.status(400).json({ message: "Invalid centre ID" });
    }

    // Create filter condition
    const centreFilter = centreId ? { centreId: new mongoose.Types.ObjectId(centreId) } : {}; // Remove this filter for all centres

    const today = new Date();

    // *** DAILY DATA (Last 12 Days) ***
    const dailySales = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(today.setDate(today.getDate() - 11)) } // Last 12 days
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } },
          totalCustomers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // *** MONTHLY DATA (Current Year - Last 12 Months) ***
    const monthlySales = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } // From Jan 1st of this year
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, // Group by Year-Month
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } },
          totalCustomers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // *** YEARLY DATA (Last 3 Years including Current Year) ***
    const yearStart = new Date();
    yearStart.setFullYear(yearStart.getFullYear() - 2, 0, 1); // Start from 2 years ago

    const yearlySales = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: yearStart } // From 2 years ago
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$createdAt" } }, // Group by Year
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } },
          totalCustomers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      message: "Sales graph data retrieved successfully",
      dailySales,
      monthlySales,
      yearlySales
    });

  } catch (error) {
    console.error("Error fetching sales graph data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const getCentreSalesReportDaily = async (req, res) => {
  try {
    const { centreId, selectedDate } = req.query;
    console.log(`Fetching sales report for date: ${selectedDate}`);

    if (!selectedDate) {
      return res.status(400).json({ message: 'Please provide a valid date' });
    }

    let centresQuery = centreId && mongoose.Types.ObjectId.isValid(centreId) ? { _id: centreId } : {};
    const centres = await Centre.find(centresQuery);

    if (!centres.length) {
      return res.status(404).json({ message: 'No centers found' });
    }

    let responseData = [];
    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    for (const centre of centres) {
      const payCriteria = centre.payCriteria;

      const salesReport = await Customer.aggregate([
        {
          $match: {
            centreId: centre._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
            totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
            totalCashCommission: { $sum: "$cashCommission" },
            totalOnlineCommission: { $sum: "$onlineCommission" },
            totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } }
          }
        }
      ]);

      let reportData = salesReport[0] || {
        totalCustomers: 0,
        totalCash: 0,
        totalOnline: 0,
        totalCashCommission: 0,
        totalOnlineCommission: 0,
        totalCommission: 0,
      };

      let balance = centre.previousBalance + centre.balance;

      responseData.push({
        centreId: centre._id,
        centreName: centre.name,
        centreCode: centre.centreId,
        payCriteria,
        balance,
        totalCash: reportData.totalCash,
        totalOnline: reportData.totalOnline,
        totalSales: payCriteria === "plus"
          ? reportData.totalCash + reportData.totalOnline - reportData.totalCommission
          : reportData.totalCash + reportData.totalOnline,
        totalCustomers: reportData.totalCustomers,
        selectedDate
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

    let balanceUpdate = 0;

    if (centre.payCriteria === "plus") {
      balanceUpdate = Number(updates.paymentCash2 || 0) + Number(updates.paymentOnline2 || 0) -
        Number(updates.cashCommission || 0) - Number(updates.onlineCommission || 0);
    } else if (centre.payCriteria === "minus") {
      balanceUpdate = Number(updates.paymentOnline2 || 0) + Number(updates.paymentCash2 || 0)
    }

    centre.balance += balanceUpdate;
    await centre.save();

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updates, { new: true });
    
    const populatedCustomer = await Customer.findById(updatedCustomer._id)
    .populate('service')
    .populate('staffAttending')
    .populate('branchId')
    .populate('centreId')
    .populate('regionId')
    .exec();

    sendSSEEvent({ message: "Customer updated", customer: populatedCustomer });
    console.log("populatedCustomer",populatedCustomer);
    
    res.status(200).json({ message: "Customer updated successfully", customer: updatedCustomer });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCustomersByCentre = async (req, res) => {
  try {
    const { centreId } = req.params;

    // Validate centreId
    if (!mongoose.isValidObjectId(centreId)) {
      return res.status(400).json({ message: 'Invalid Centre ID' });
    }

    // Find customers belonging to the given centre
    const customers = await Customer.find({ centreId })
      .populate('service')
      .populate('staffAttending')
      .populate('branchId')
      .populate('centreId')
      .populate('regionId')
      .exec();

    if (!customers.length) {
      return res.status(404).json({ message: 'No customers found for this centre' });
    }

    res.status(200).json({ message: 'Customers retrieved successfully', customers });
  } catch (error) {
    console.error('Error fetching customers by centre:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



module.exports = { addCustomer, getCustomers, getCentreSalesReport, getCustomerById, editCustomer, sseHandler, getCentreSalesReportDaily, getSalesGraphData, getCustomersByCentre};