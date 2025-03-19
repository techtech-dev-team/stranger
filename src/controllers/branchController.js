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

exports.createBranch = async (req, res) => {
  const { name, shortCode, regionId } = req.body;

  try {
    // Check if the regionId exists
    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(400).json({ message: 'Region not found' });
    }

    // Create a new branch
    const newBranch = new Branch({
      name,
      shortCode,
      regionName: region.name,  // Fetch region name dynamically
      regionId: region._id      // Save the ObjectId of the region
    });

    await newBranch.save();
    res.status(201).json({ message: "Branch created successfully", newBranch });
  } catch (error) {
    console.error("Error creating branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a branch by ID
// @route  PUT /api/branches/:id
// @access Private
exports.updateBranch = async (req, res) => {
  const { name, shortCode, regionId } = req.body;

  try {
    // Find the branch by ID and check if it exists
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Check if the regionId exists
    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(400).json({ message: 'Region not found' });
    }

    // Update the branch
    branch.name = name || branch.name;
    branch.shortCode = shortCode || branch.shortCode;
    branch.regionName = region.name || branch.regionName;
    branch.regionId = region._id || branch.regionId;

    await branch.save();
    res.status(200).json({ message: "Branch updated successfully", branch });
  } catch (error) {
    console.error("Error updating branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete a branch by ID
// @route  DELETE /api/branches/:id
// @access Private
exports.deleteBranch = async (req, res) => {
  try {
    // Find the branch by ID and delete it
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};
