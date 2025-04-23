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
const getCustomersFast = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30; // You can tweak this if needed
    const skip = (page - 1) * limit;

    const customers = await Customer.find()
      .populate({ path: 'service', select: '-__v' }) // All fields except version
      .populate({ path: 'staffAttending', select: '-__v' })
      .populate({ path: 'branchId', select: '-__v' })
      .populate({ path: 'centreId', select: '-__v' })
      .populate({ path: 'regionId', select: '-__v' })
      .skip(skip)
      .limit(limit)
      .lean(); 

    res.status(200).json({
      page,
      limit,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
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

// const getCentreSalesReport = async (req, res) => {
//   try {
//     const { centreId } = req.query;

//     let centresQuery = centreId && mongoose.Types.ObjectId.isValid(centreId) ? { _id: centreId } : {};

//     // Fetch all centers or specific center
//     const centres = await Centre.find(centresQuery);
//     if (!centres.length) {
//       return res.status(404).json({ message: 'No centers found' });
//     }

//     let responseData = [];

//     for (const centre of centres) {
//       const payCriteria = centre.payCriteria; // "plus" or "minus"

//       const salesReport = await Customer.aggregate([
//         { $match: { centreId: centre._id } },
//         {
//           $group: {
//             _id: null,
//             totalCustomers: { $sum: 1 }, // Count the number of customers
//             totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
//             totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
//             totalCashCommission: { $sum: "$cashCommission" },
//             totalOnlineCommission: { $sum: "$onlineCommission" },
//             totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } }
//           }
//         },
//         {
//           $project: {
//             _id: 0,
//             totalCustomers: 1,
//             totalCash: 1,
//             totalOnline: 1,
//             totalCashCommission: 1,
//             totalOnlineCommission: 1,
//             totalCommission: 1,
//             grandTotal: {
//               $cond: {
//                 if: { $eq: [payCriteria, "plus"] },
//                 then: {
//                   $subtract: [
//                     { $add: ["$totalCash", "$totalOnline"] },
//                     "$totalCommission"
//                   ]
//                 },
//                 else: { $add: ["$totalCash", "$totalOnline"] }
//               }
//             },
//             balance: {
//               $cond: {
//                 if: { $eq: [payCriteria, "plus"] },
//                 then: { $subtract: ["$totalCash", "$totalCashCommission"] },
//                 else: "$totalCash"
//               }
//             }
//           }
//         }
//       ]);

//       // Calculate totals for the center
//       let balance = centre.previousBalance + centre.balance;

//       responseData.push({
//         centreId: centre._id,
//         centreName: centre.name,
//         centreCode: centre.centreId,
//         payCriteria,
//         balance,
//         totalCash: salesReport[0]?.totalCash || 0,
//         totalOnline: salesReport[0]?.totalOnline || 0,
//         totalSales: salesReport[0]?.grandTotal || 0,
//         totalCustomers: salesReport[0]?.totalCustomers || 0, // Added customer count
//         branchName: centre.branchName,
//         salesReport
//       });
//     }

//     res.status(200).json({
//       message: 'Sales report retrieved successfully',
//       data: responseData
//     });

//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };
const getCentreSalesReport = async (req, res) => {
  const startTime = Date.now();
  try {
    const { centreId } = req.query;

    const centresQuery =
      centreId && mongoose.Types.ObjectId.isValid(centreId)
        ? { _id: centreId }
        : {};

    const centres = await Centre.find(centresQuery).lean();
    if (!centres.length) {
      return res.status(404).json({ message: 'No centres found' });
    }

    const centreMap = {};
    centres.forEach(c => centreMap[c._id.toString()] = c);

    const customerAgg = await Customer.aggregate([
      {
        $match: {
          centreId: { $in: centres.map(c => c._id) },
        },
      },
      {
        $group: {
          _id: "$centreId",
          totalCustomers: { $sum: 1 },
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalCashCommission: { $sum: "$cashCommission" },
          totalOnlineCommission: { $sum: "$onlineCommission" },
          totalCommission: {
            $sum: { $add: ["$cashCommission", "$onlineCommission"] }
          },
        },
      },
    ]);

    const salesMap = {};
    customerAgg.forEach(s => salesMap[s._id.toString()] = s);

    const responseData = centres.map(centre => {
      const centreIdStr = centre._id.toString();
      const report = salesMap[centreIdStr] || {
        totalCustomers: 0,
        totalCash: 0,
        totalOnline: 0,
        totalCashCommission: 0,
        totalOnlineCommission: 0,
        totalCommission: 0,
      };

      const payCriteria = centre.payCriteria;
      const balance = centre.previousBalance + centre.balance;

      const grandTotal = payCriteria === 'plus'
        ? report.totalCash + report.totalOnline - report.totalCommission
        : report.totalCash + report.totalOnline;

      const cashBalance = payCriteria === 'plus'
        ? report.totalCash - report.totalCashCommission
        : report.totalCash;

      return {
        centreId: centre._id,
        centreName: centre.name,
        centreCode: centre.centreId,
        branchName: centre.branchName,
        payCriteria,
        balance,
        totalCash: report.totalCash,
        totalOnline: report.totalOnline,
        totalSales: grandTotal,
        totalCustomers: report.totalCustomers,
        cashBalance,
      };
    });

    const endTime = Date.now();
    console.log(`🚀 Report built in ${endTime - startTime}ms`);

    res.status(200).json({
      message: "Sales report retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ getCentreSalesReport error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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

// const getCentreSalesReportDaily = async (req, res) => {
//   try {
//     const { centreId, selectedDate } = req.query;
//     console.log(`Fetching sales report for date: ${selectedDate}`);

//     if (!selectedDate) {
//       return res.status(400).json({ message: 'Please provide a valid date' });
//     }

//     let centresQuery = centreId && mongoose.Types.ObjectId.isValid(centreId) ? { _id: centreId } : {};
//     const centres = await Centre.find(centresQuery);

//     if (!centres.length) {
//       return res.status(404).json({ message: 'No centers found' });
//     }

//     let responseData = [];
//     const startOfDay = new Date(selectedDate);
//     const endOfDay = new Date(selectedDate);
//     endOfDay.setHours(23, 59, 59, 999);

//     for (const centre of centres) {
//       const payCriteria = centre.payCriteria;

//       const salesReport = await Customer.aggregate([
//         {
//           $match: {
//             centreId: centre._id,
//             createdAt: { $gte: startOfDay, $lte: endOfDay }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             totalCustomers: { $sum: 1 },
//             totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
//             totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
//             totalCashCommission: { $sum: "$cashCommission" },
//             totalOnlineCommission: { $sum: "$onlineCommission" },
//             totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } }
//           }
//         }
//       ]);

//       let reportData = salesReport[0] || {
//         totalCustomers: 0,
//         totalCash: 0,
//         totalOnline: 0,
//         totalCashCommission: 0,
//         totalOnlineCommission: 0,
//         totalCommission: 0,
//       };

//       let balance = centre.previousBalance + centre.balance;

//       responseData.push({
//         centreId: centre._id,
//         centreName: centre.name,
//         centreCode: centre.centreId,
//         branchName: centre.branchName, // added branchName
//         payCriteria,
//         balance,
//         totalCash: reportData.totalCash,
//         totalOnline: reportData.totalOnline,
//         totalSales: payCriteria === "plus"
//           ? reportData.totalCash + reportData.totalOnline - reportData.totalCommission
//           : reportData.totalCash + reportData.totalOnline,
//         totalCustomers: reportData.totalCustomers,
//         selectedDate
//       });
//     }

//     res.status(200).json({
//       message: 'Sales report retrieved successfully',
//       data: responseData
//     });

//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };
const getCentreSalesReportDaily = async (req, res) => {
  try {
    const { centreId, selectedDate } = req.query;
    console.log(`Fetching sales report for date: ${selectedDate}`);

    if (!selectedDate) {
      return res.status(400).json({ message: 'Please provide a valid date' });
    }

    // Create centre query filter
    const centresQuery =
      centreId && mongoose.Types.ObjectId.isValid(centreId)
        ? { _id: centreId }
        : {};

    // Get all centres (lean = faster, plain JS objects)
    const centres = await Centre.find(centresQuery).lean();

    if (!centres.length) {
      return res.status(404).json({ message: 'No centers found' });
    }

    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get sales data for all centres in one go
    const salesReports = await Customer.aggregate([
      {
        $match: {
          centreId: { $in: centres.map((c) => c._id) },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: "$centreId",
          totalCustomers: { $sum: 1 },
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalCashCommission: { $sum: "$cashCommission" },
          totalOnlineCommission: { $sum: "$onlineCommission" },
          totalCommission: {
            $sum: { $add: ["$cashCommission", "$onlineCommission"] }
          }
        }
      }
    ]);

    // Map sales data to each centre by centreId
    const salesMap = {};
    salesReports.forEach((report) => {
      salesMap[report._id.toString()] = report;
    });

    const responseData = centres.map((centre) => {
      const report = salesMap[centre._id.toString()] || {
        totalCustomers: 0,
        totalCash: 0,
        totalOnline: 0,
        totalCashCommission: 0,
        totalOnlineCommission: 0,
        totalCommission: 0
      };

      const balance = centre.previousBalance + centre.balance;

      return {
        centreId: centre._id,
        centreName: centre.name,
        centreCode: centre.centreId,
        branchName: centre.branchName,
        payCriteria: centre.payCriteria,
        balance,
        totalCash: report.totalCash,
        totalOnline: report.totalOnline,
        totalSales:
          centre.payCriteria === "plus"
            ? report.totalCash + report.totalOnline - report.totalCommission
            : report.totalCash + report.totalOnline,
        totalCustomers: report.totalCustomers,
        selectedDate
      };
    });

    res.status(200).json({
      message: 'Sales report retrieved successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error in getCentreSalesReportDaily:', error);
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

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log("Update Payload:", updates);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const existingCustomer = await Customer.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check if the customer can be edited (5 minutes after creation)
    const now = new Date();
    const createdAt = new Date(existingCustomer.createdAt);
    const diff = now.getTime() - createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    console.log(`Customer created ${minutes} minutes ago`);

    // 👉 Temporarily disabled this condition for flexibility
    // if (minutes < 5) {
    //   return res.status(403).json({ message: "Customer can only be edited 5 minutes after checkout." });
    // }

    // Convert service name to ObjectId if necessary
    if (updates.service && typeof updates.service === "string") {
      const serviceDoc = await Service.findOne({ name: updates.service.trim() });
      if (!serviceDoc) {
        return res.status(400).json({ message: "Invalid service name provided" });
      }
      updates.service = serviceDoc._id;
    }

    const centre = await Centre.findById(existingCustomer.centreId);
    if (!centre) {
      return res.status(404).json({ message: "Centre not found" });
    }

    console.log("Centre Pay Criteria:", centre.payCriteria);

    let balanceUpdate = 0;
    if (centre.payCriteria === "plus") {
      balanceUpdate = Number(updates.paymentCash2 || 0) + Number(updates.paymentOnline2 || 0)
        - Number(updates.cashCommission || 0) - Number(updates.onlineCommission || 0);
    } else if (centre.payCriteria === "minus") {
      balanceUpdate = Number(updates.paymentOnline2 || 0) + Number(updates.paymentCash2 || 0);
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
    console.log("populatedCustomer", populatedCustomer);

    res.status(200).json({ message: "Customer updated successfully", customer: updatedCustomer });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDashboardBlocks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dateRangeQuery = { createdAt: { $gte: today, $lt: tomorrow } };

    // Run all DB calls in parallel
    const [
      todaysCustomers,
      allCustomers,
      staffList,
      activeCentersCount,
      inactiveCentersCount
    ] = await Promise.all([
      Customer.countDocuments(dateRangeQuery),
      Customer.find(dateRangeQuery).select(
        'paymentOnline1 paymentOnline2 paymentCash1 paymentCash2 cashCommission onlineCommission'
      ),
      User.find({ role: "ClubStaff" }).select('monthlyAttendance'),
      Centre.countDocuments({ status: "active" }),
      Centre.countDocuments({ status: "inactive" })
    ]);

    // Calculate totals
    let totalOnline = 0;
    let totalCash = 0;
    let totalCommission = 0;

    allCustomers.forEach(customer => {
      totalOnline += (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
      totalCash += (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
      totalCommission += (customer.cashCommission || 0) + (customer.onlineCommission || 0);
    });

    const totalCollection = totalOnline + totalCash;

    // Format today's date as string
    const todayDateString = today.toISOString().split('T')[0];

    // Count staff present today
    const presentStaffCount = staffList.filter(staff => {
      const attendance = staff.monthlyAttendance || {};
      return attendance[todayDateString];
    }).length;

    // Prepare dashboard blocks
    const blocksData = [
      { id: 1, title: "Today's Customers", value: todaysCustomers, section: "customers" },
      { id: 2, title: "Staff Present Today", value: presentStaffCount, section: "staff-attendance" },
      { id: 3, title: "Online Collection", value: `${totalOnline} Rs`, section: "online-collection" },
      { id: 4, title: "Cash Collection", value: `${totalCash} Rs`, section: "cash-collection" },
      { id: 5, title: "Total Collection", value: `${totalCollection} Rs`, section: "total-collection" },
      { id: 6, title: "Commission", value: `${totalCommission} Rs`, section: "commission" },
      { id: 7, title: "All Centers", value: activeCentersCount, section: "center-active" },
      { id: 8, title: "Inactive Centers", value: inactiveCentersCount, section: "center-inactive" }
    ];

    res.status(200).json(blocksData);

  } catch (error) {
    console.error("Error in getDashboardBlocks:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


const getFilteredCustomers = async (_, res) => {
  console.log("🔥 getFilteredCustomers called");
  try {
    const customers = await Customer.find({
      status: { $nin: ["All ok", "null"] }
    })
      .populate('service')
      .populate('staffAttending')
      .populate('branchId')
      .populate('centreId')
      .populate('regionId')
      .exec();
  
    res.status(200).json(customers);
  } catch (error) {
    console.error("🔥 Error during customer fetch:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};  

module.exports = {getDashboardBlocks ,addCustomer, getCustomersFast, updateCustomer,getCustomers, getCentreSalesReport, getCustomerById, editCustomer, sseHandler, getCentreSalesReportDaily, getSalesGraphData, getCustomersByCentre,getFilteredCustomers};