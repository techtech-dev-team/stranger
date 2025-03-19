const Branch = require("../models/Branch");
const Customer = require("../models/Customer");
const moment = require("moment");
const mongoose = require("mongoose");

// Helpers
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const initializeMonthlyData = () =>
  Array.from({ length: 12 }, (_, i) => ({
    month: moment().month(i).format("MMMM"),
    value: 0,
  }));

const getCustomersForYearByBranch = async (year, branchId) => {
  const startOfYear = moment().year(year).startOf("year").toDate();
  const endOfYear = moment().year(year).endOf("year").toDate();
  const query = { createdAt: { $gte: startOfYear, $lt: endOfYear } };
  if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId);
  return Customer.find(query);
};

const getCustomersForYear = async (year, branchId = null) => {
  const startOfYear = moment().year(year).startOf("year").toDate();
  const endOfYear = moment().year(year).endOf("year").toDate();
  
  const query = { createdAt: { $gte: startOfYear, $lt: endOfYear } };
  if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId);

  return Customer.find(query);
};

// Extract and validate branchId
const extractBranchId = (rawBranchId) => {
  if (!rawBranchId) return null;
  const branchId = rawBranchId.$oid ? rawBranchId.$oid : rawBranchId;
  return isValidObjectId(branchId) ? branchId : null;
};

exports.getCombinedMonthlySales = async (req, res) => {
  try {
    const { year } = req.query;

    // Validate year, default to current year
    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    // Fetch customers for the year (across all branches)
    const customers = await getCustomersForYear(validYear);

    // Initialize combined sales data
    const monthlySales = initializeMonthlyData();

    // Calculate total sales for each month
    customers.forEach((customer) => {
      const monthIndex = moment(customer.createdAt).month();
      const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
      const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
      const totalCommission = (customer.cashCommission || 0) + (customer.onlineCommission || 0);
      monthlySales[monthIndex].value += totalCash + totalOnline - totalCommission;
    });

    res.status(200).json(monthlySales);
  } catch (error) {
    console.error("Error fetching combined monthly sales:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Get Combined Monthly Clients for All Branches
exports.getCombinedMonthlyClients = async (req, res) => {
  try {
    const { year } = req.query;

    // Validate year, default to current year
    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    // Fetch customers for the year (across all branches)
    const customers = await getCustomersForYear(validYear);

    // Initialize combined clients data
    const monthlyClients = initializeMonthlyData();

    // Count clients for each month
    customers.forEach((customer) => {
      const monthIndex = moment(customer.createdAt).month();
      monthlyClients[monthIndex].value += 1;
    });

    res.status(200).json(monthlyClients);
  } catch (error) {
    console.error("Error fetching combined monthly clients:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// API: Monthly Sales by Branch
exports.getMonthlySalesByBranch = async (req, res) => {
  try {
    const { branchId: rawBranchId, year } = req.query;
    const branchId = extractBranchId(rawBranchId);

    if (!branchId) {
      return res.status(400).json({ message: "Invalid branchId" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByBranch(validYear, branchId);
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
    console.error("Error fetching monthly sales by branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// API: Monthly Clients by Branch
exports.getMonthlyClientsByBranch = async (req, res) => {
  try {
    const { branchId: rawBranchId, year } = req.query;
    const branchId = extractBranchId(rawBranchId);

    if (!branchId) {
      return res.status(400).json({ message: "Invalid branchId" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const customers = await getCustomersForYearByBranch(validYear, branchId);
    const monthlyClients = initializeMonthlyData();

    customers.forEach((customer) => {
      const monthIndex = moment(customer.createdAt).month();
      monthlyClients[monthIndex].value += 1;
    });

    res.status(200).json(monthlyClients);
  } catch (error) {
    console.error("Error fetching monthly clients by branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// API: Get All Branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find({}).populate("regionId", "name");
    if (!branches.length) {
      return res.status(404).json({ message: "No branches found" });
    }
    res.status(200).json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// API: Get Branch by ID
exports.getBranchById = async (req, res) => {
  try {
    const branchId = extractBranchId(req.params.id);

    if (!branchId) {
      return res.status(400).json({ message: "Invalid branchId" });
    }

    const branch = await Branch.findById(branchId).populate("regionId", "name");
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};
