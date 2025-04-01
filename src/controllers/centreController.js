const Centre = require("../models/Centre");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");
const moment = require("moment");
const Expense = require("../models/Expense");
let sseClients = []; // Store SSE clients


const initializeMonthlyData = () => {
  return moment.months().map(month => ({ month, value: 0 }));
};
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getCustomersForYearByCentre = async (year, centreId = null) => {
  const startOfYear = moment().year(year).startOf("year").toDate();
  const endOfYear = moment().year(year).endOf("year").toDate();

  const query = { createdAt: { $gte: startOfYear, $lt: endOfYear } };
  if (centreId) query.centreId = new mongoose.Types.ObjectId(centreId);

  return Customer.find(query);
};

const extractCentreId = (rawCentreId) => {
  if (!rawCentreId) return null;
  const centreId = rawCentreId.$oid ? rawCentreId.$oid : rawCentreId;
  return isValidObjectId(centreId) ? centreId : null;
};

exports.sseCentreUpdates = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  sseClients.push({ req, res });

  req.on("close", () => {
    sseClients = sseClients.filter(client => client.res !== res);
  });
};

exports.getCombinedMonthlySalesByCentre = async (req, res) => {
  try {
    const { year } = req.query;
    const { centerId } = req.query; // Instead of req.params

    if (!centerId) {
      return res.status(400).json({ message: "Center ID is required" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear) || validYear < 2000 || validYear > moment().year()) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByCentre(validYear, centerId);
    if (!customers.length) {
      return res.status(200).json(initializeMonthlyData()); // Return 0s for all months
    }


    const monthlySales = initializeMonthlyData(); // Initialize with all months

    customers.forEach((customer) => {
      const month = moment(customer.createdAt).format("MMMM");
      const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
      const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
      const totalCommission = (customer.cashCommission || 0) + (customer.onlineCommission || 0);
      const saleAmount = totalCash + totalOnline - totalCommission;

      const monthEntry = monthlySales.find(entry => entry.month === month);
      if (monthEntry) {
        monthEntry.value += saleAmount;
      }
    });

    res.status(200).json(monthlySales); // Always return full dataset

  } catch (error) {
    console.error("Error fetching combined monthly sales by centre:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCombinedMonthlyClientsByCentre = async (req, res) => {
  try {
    const { year } = req.query;
    const { centerId } = req.query; // Instead of req.params

    if (!centerId) {
      return res.status(400).json({ message: "Center ID is required" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear) || validYear < 2000 || validYear > moment().year()) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByCentre(validYear, centerId);
    if (!customers.length) {
      return res.status(200).json(initializeMonthlyData()); // Return 0s for all months
    }


    const monthlyClients = initializeMonthlyData();

    customers.forEach((customer) => {
      const month = moment(customer.createdAt).format("MMMM");
      const monthEntry = monthlyClients.find(entry => entry.month === month);
      if (monthEntry) {
        monthEntry.value += 1;
      }
    });

    res.status(200).json(monthlyClients);
  } catch (error) {
    console.error("Error fetching combined monthly clients by centre:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMonthlySalesByCentre = async (req, res) => {
  try {
    const { centreId: rawCentreId, year } = req.query;
    const centreId = extractCentreId(rawCentreId);
    if (!centreId) {
      return res.status(400).json({ message: "Invalid centreId" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByCentre(validYear, centreId);
    const monthlySales = initializeMonthlyData();

    customers.forEach((customer) => {
      const monthIndex = moment(customer.createdAt).month();
      const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
      const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
      const totalCommission = (customer.cashCommission || 0) + (customer.onlineCommission || 0);
      monthlySales[monthIndex].value += totalCash + totalOnline - totalCommission;
    });

    res.status(200).json(monthlySales);
  } catch (error) {
    console.error("Error fetching monthly sales by centre:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMonthlyClientsByCentre = async (req, res) => {
  try {
    const { centreId: rawCentreId, year } = req.query;
    const centreId = extractCentreId(rawCentreId);
    if (!centreId) {
      return res.status(400).json({ message: "Invalid centreId" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByCentre(validYear, centreId);
    const monthlyClients = initializeMonthlyData();

    customers.forEach((customer) => {
      const monthIndex = moment(customer.createdAt).month();
      monthlyClients[monthIndex].value += 1;
    });

    res.status(200).json(monthlyClients);
  } catch (error) {
    console.error("Error fetching monthly clients by centre:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllCentres = async (req, res) => {
  try {
    const centres = await Centre.find().lean();
    res.json(centres);
  } catch (error) {
    res.status(500).json({ message: "Error fetching centres", error: error.message });
  }
};

exports.getCentreById = async (req, res) => {
  try {
    const { id } = req.params;
    let centre;

    if (id === "inactive") {
      return exports.getInactiveCentres(req, res);
    } else {
      // Validate if ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Centre ID" });
      }

      // Fetch centre by ID
      centre = await Centre.findById(id)
        .populate("branchId", "name shortCode")
        .populate("regionId", "name");
    }

    if (!centre) {
      return res.status(404).json({ message: "Centre not found" });
    }

    res.status(200).json(centre);
  } catch (error) {
    console.error("Error fetching centre:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getInactiveCentres = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().endOf('day').toDate();

    // Find centres that have customers added today
    const activeCentreIds = await Customer.distinct("centreId", {
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Fetch all centres excluding the active ones
    const inactiveCentres = await Centre.find({
      _id: { $nin: activeCentreIds }
    })
      .populate("branchId", "name shortCode")
      .populate("regionId", "name");

    if (!inactiveCentres.length) {
      return res.status(200).json({ message: "All centres have customer entries today" });
    }

    res.status(200).json(inactiveCentres);
  } catch (error) {
    console.error("Error fetching inactive centres:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getActiveCentres = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().endOf('day').toDate();

    // Find centres that have customers added today
    const activeCentreIds = await Customer.distinct("centreId", {
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (!activeCentreIds.length) {
      return res.status(200).json({ message: "No centres have customer entries today" });
    }

    // Fetch only the active centres
    const activeCentres = await Centre.find({
      _id: { $in: activeCentreIds }
    })
      .populate("branchId", "name shortCode")
      .populate("regionId", "name");

    res.status(200).json(activeCentres);
  } catch (error) {
    console.error("Error fetching active centres:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCentreStatistics = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ message: "Invalid or missing date parameter" });
    }

    const startOfDay = moment(date).startOf("day").toDate();
    const endOfDay = moment(date).endOf("day").toDate();

    // Fetch all centres
    const centres = await Centre.find({});
    if (!centres.length) {
      return res.status(404).json({ message: "No centres found" });
    }

    // Initialize stats per centre
    const centreStats = centres.map(centre => ({
      centreId: centre._id,
      name: centre.name,
      shortCode: centre.shortCode,
      totalClients: 0,
      totalSales: 0
    }));

    // Get customers for the selected date with centreId populated
    const customers = await Customer.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).populate("centreId", "name shortCode");

    // Calculate statistics
    customers.forEach(customer => {
      const centre = centreStats.find(c => c.centreId.toString() === customer.centreId._id.toString());

      if (centre) {
        centre.totalClients += 1;

        const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
        const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
        const totalCommission = (customer.cashCommission || 0) + (customer.onlineCommission || 0);

        // Assuming payCriteria logic is elsewhere, subtracting commission as before
        centre.totalSales += (totalCash + totalOnline - totalCommission);
      }
    });

    res.status(200).json(centreStats);
  } catch (error) {
    console.error("Error fetching centre statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addCentre = async (req, res) => {
  const { name, shortCode, centreId, branchName, payCriteria, regionId, branchId, status } = req.body;

  try {
    const newCentre = new Centre({
      name,
      shortCode,
      centreId,
      branchName,
      payCriteria,
      regionId,
      branchId,
      status
    });

    await newCentre.save();

    // Notify SSE clients
    sseClients.forEach(client => client.res.write(`data: ${JSON.stringify({ event: "new-centre", centre: newCentre })}\n\n`));

    res.status(201).json({ message: "Centre added successfully", centre: newCentre });
  } catch (error) {
    res.status(500).json({ message: "Error adding centre", error: error.message });
  }
};

exports.getCentreReport = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { selectedDate } = req.query; // Get selected date

    // Check if centerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({ success: false, message: "Invalid center ID" });
    }

    const centerObjectId = new mongoose.Types.ObjectId(centerId);

    // Fetch center data and populate necessary fields
    const center = await Centre.findById(centerObjectId).lean();

    if (!center) {
      return res.status(404).json({ success: false, message: "Center not found" });
    }

    // Construct date filter
    const matchCondition = { centreId: centerObjectId };
    if (selectedDate) {
      const dateStart = new Date(selectedDate);
      dateStart.setHours(0, 0, 0, 0);

      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(23, 59, 59, 999);

      matchCondition.createdAt = { $gte: dateStart, $lte: dateEnd };
    }

    // Get sales data for the center using aggregation
    const salesReport = await Customer.aggregate([
      { $match: matchCondition },
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
              if: { $eq: [center.payCriteria, "plus"] },
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
              if: { $eq: [center.payCriteria, "plus"] },
              then: { $subtract: ["$totalCash", "$totalCashCommission"] },
              else: "$totalCash"
            }
          }
        }
      }
    ]);

    let balance = center.previousBalance + center.balance || 0;

    const customers = await Customer.find(matchCondition)
      .populate("service", "name price")  // Populating service details
      .populate("staffAttending", "name role")  // Populating staff details
      .lean();

    const expenseMatchCondition = { centreIds: centerObjectId };
    if (selectedDate) {
      const dateStart = new Date(selectedDate);
      dateStart.setHours(0, 0, 0, 0);

      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(23, 59, 59, 999);

      expenseMatchCondition.createdAt = { $gte: dateStart, $lte: dateEnd };
    }

    const expenses = await Expense.find(expenseMatchCondition).lean();
    const totalExpense = expenses.reduce((total, expense) => total + (expense.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        centreName: center.name,
        totalSales: salesReport.length > 0 ? salesReport[0].grandTotal : 0,
        totalCustomers: salesReport.length > 0 ? salesReport[0].totalCustomers : 0,
        totalCash: salesReport.length > 0 ? salesReport[0].totalCash : 0,
        totalOnline: salesReport.length > 0 ? salesReport[0].totalOnline : 0,
        totalCommission: salesReport.length > 0 ? salesReport[0].totalCommission : 0,
        expensesTotal: totalExpense || 0,
        cashCommission: salesReport.length > 0 ? salesReport[0].totalCashCommission : 0,
        onlineComm: salesReport.length > 0 ? salesReport[0].totalOnlineCommission : 0,
        balance,
        centerDetails: center,
        customers,
        expenses,
        salesReport
      }
    });

  } catch (error) {
    console.error(`Error fetching report for Center ID ${req.params.centerId}:`, error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPreviousThreeDaysSales = async (req, res) => {
  try {
    const { centerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({ success: false, message: "Invalid center ID" });
    }

    const centerObjectId = new mongoose.Types.ObjectId(centerId);
    const centre = await Centre.findById(centerObjectId);
    if (!centre) {
      return res.status(404).json({ success: false, message: "Centre not found" });
    }

    const today = moment().endOf("day");
    const threeDaysAgo = moment().subtract(2, "days").startOf("day");

    const salesData = await Customer.aggregate([
      {
        $match: {
          centreId: centerObjectId,
          createdAt: { $gte: threeDaysAgo.toDate(), $lt: today.toDate() }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalCustomers: { $sum: 1 },
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } },
        }
      }
    ]);

    res.status(200).json({ success: true, centerId, salesData });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getCentresWithDetails = async (req, res) => {
  try {
    const centres = await Centre.find()
      .populate("branchId") // Populate full branch details
      .populate("regionId") // Populate full region details
      .lean();

    res.json(centres);
  } catch (error) {
    console.error("Error fetching centres with full details:", error);
    res.status(500).json({ message: "Error fetching centres", error: error.message });
  }
};

// SSE Implementation
exports.sseCentreUpdates = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  sseClients.push({ req, res });

  req.on("close", () => {
    sseClients = sseClients.filter(client => client.res !== res);
  });
};

