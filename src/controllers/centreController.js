const Centre = require("../models/Centre");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");
const moment = require("moment");

// ===== Helpers =====

// Validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Initialize Monthly Data
const initializeMonthlyData = () =>
  Array.from({ length: 12 }, (_, i) => ({
    month: moment().month(i).format("MMMM"),
    value: 0,
  }));

// Fetch Customers for Year (All Centres or Specific Centre)
const getCustomersForYearByCentre = async (year, centreId = null) => {
  const startOfYear = moment().year(year).startOf("year").toDate();
  const endOfYear = moment().year(year).endOf("year").toDate();

  const query = { createdAt: { $gte: startOfYear, $lt: endOfYear } };
  if (centreId) query.centreId = new mongoose.Types.ObjectId(centreId);

  return Customer.find(query);
};

// Extract and validate centreId
const extractCentreId = (rawCentreId) => {
  if (!rawCentreId) return null;
  const centreId = rawCentreId.$oid ? rawCentreId.$oid : rawCentreId;
  return isValidObjectId(centreId) ? centreId : null;
};

// ===== APIs =====

// 📌 Get Combined Monthly Sales for All Centres
exports.getCombinedMonthlySalesByCentre = async (req, res) => {
  try {
    const { year } = req.query;
    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByCentre(validYear);
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
    console.error("Error fetching combined monthly sales by centre:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Get Monthly Sales for a Specific Centre
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

// 📌 Get Combined Monthly Clients for All Centres
exports.getCombinedMonthlyClientsByCentre = async (req, res) => {
  try {
    const { year } = req.query;
    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByCentre(validYear);
    const monthlyClients = initializeMonthlyData();

    customers.forEach((customer) => {
      const monthIndex = moment(customer.createdAt).month();
      monthlyClients[monthIndex].value += 1;
    });

    res.status(200).json(monthlyClients);
  } catch (error) {
    console.error("Error fetching combined monthly clients by centre:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Get Monthly Clients for a Specific Centre
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
    const centres = await Centre.find({})
      .populate("branchId") // Fetch branch name and short code
      .populate("regionId"); // Fetch region name

    if (!centres.length) {
      return res.status(404).json({ message: "No centres found" });
    }
    res.status(200).json(centres);
  } catch (error) {
    console.error("Error fetching centres:", error);
    res.status(500).json({ message: "Server error" });
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

