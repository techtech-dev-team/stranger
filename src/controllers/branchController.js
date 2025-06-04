const Branch = require("../models/Branch");
const Customer = require("../models/Customer");
const moment = require("moment");
const mongoose = require("mongoose");
const Region = require("../models/Region");


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
    const { year, month, week, branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Invalid branchId format" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return res.status(400).json({ message: "Branch not found" });
    }

    let startDate, endDate, data;

    if (week && month && year) {
      // Daily data for that week
      const paddedMonth = String(month).padStart(2, '0');
      const startOfMonth = moment(`${validYear}-${paddedMonth}-01`);
      startDate = moment(startOfMonth).add((week - 1) * 7, 'days').startOf('day');
      endDate = moment(startDate).add(6, 'days').endOf('day');

      data = Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        totalSales: 0,
        customerCount: 0
      }));

      const customers = await Customer.find({
        branchId: branchId,
        createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      });

      customers.forEach((customer) => {
        const dayIndex = moment(customer.createdAt).day(); // 0 = Sunday, 6 = Saturday
        const dayAdjustedIndex = (dayIndex + 6) % 7; // Monday as 0
        const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
        const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
        data[dayAdjustedIndex].totalSales += totalCash + totalOnline;
        data[dayAdjustedIndex].customerCount += 1;
      });

    } else if (month && year) {
      // Weekly data for that month
      const paddedMonth = String(month).padStart(2, '0');
      startDate = moment(`${validYear}-${paddedMonth}-01`).startOf('month');
      endDate = moment(startDate).endOf('month');

      data = Array.from({ length: 4 }, (_, i) => ({
        week: i + 1,
        totalSales: 0,
        customerCount: 0
      }));

      const customers = await Customer.find({
        branchId: branchId,
        createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      });

      customers.forEach((customer) => {
        const createdAt = moment(customer.createdAt);
        const weekOfMonth = Math.ceil(createdAt.date() / 7);
        const weekIndex = Math.min(weekOfMonth - 1, 3);
        const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
        const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
        data[weekIndex].totalSales += totalCash + totalOnline;
        data[weekIndex].customerCount += 1;
      });

    } else if (year) {
      // Monthly data for that year
      startDate = moment(`${validYear}-01-01`).startOf('year');
      endDate = moment(startDate).endOf('year');

      data = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        totalSales: 0,
        customerCount: 0
      }));

      const customers = await Customer.find({
        branchId: branchId,
        createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      });

      customers.forEach((customer) => {
        const monthIndex = moment(customer.createdAt).month(); // 0-indexed
        const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
        const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
        data[monthIndex].totalSales += totalCash + totalOnline;
        data[monthIndex].customerCount += 1;
      });

    } else {
      return res.status(400).json({ message: "Please provide at least the year parameter." });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching branch-wise sales data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCombinedMonthlyClients = async (req, res) => {
  try {
    const { year, branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    // Validate branchId format (should be a MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Invalid branchId format" });
    }

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    // Check if the branch exists
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return res.status(400).json({ message: "Branch not found" });
    }

    // Fetch customers for the year and specific branch
    const customers = await getCustomersForYear(validYear, branchId);

    // Initialize combined clients data
    const monthlyClients = initializeMonthlyData();

    // Count clients for each month
    customers.forEach((customer) => {
      const monthIndex = moment(customer.createdAt).month();
      monthlyClients[monthIndex].value += 1;
    });

    res.status(200).json(monthlyClients);
  } catch (error) {
    console.error("Error fetching branch-wise monthly clients:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// API: Monthly Sales by Branch
exports.getMonthlySalesByBranch = async (req, res) => {
  try {
    const { branchId: rawBranchId, year } = req.query;
    const branchId = rawBranchId ? extractBranchId(rawBranchId) : null; // Allow null branchId

    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    let customers;
    if (branchId) {
      customers = await getCustomersForYearByBranch(validYear, branchId);
    } else {
      customers = await getCustomersForYear(validYear); // Corrected function call
    }


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
    console.error("Error fetching monthly sales:", error);
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
    console.log("Branch saved successfully:", newBranch); // Log the saved branch
    res.status(201).json({ message: "Branch created successfully", newBranch });
  } catch (error) {
    console.error("Error creating branch:", error);
    console.error("Error details:", error.message, error.stack); // Log more error details
    res.status(500).json({ message: "Server error" });
  }
};

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

exports.getBranchStatistics = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ message: "Invalid or missing date parameter" });
    }

    const startOfDay = moment(date).startOf("day").toDate();
    const endOfDay = moment(date).endOf("day").toDate();

    // Fetch all branches
    const branches = await Branch.find({});
    if (!branches.length) {
      return res.status(404).json({ message: "No branches found" });
    }

    // Initialize stats per branch
    const branchStats = branches.map(branch => ({
      branchId: branch._id,
      name: branch.name,
      shortCode: branch.shortCode,
      totalClients: 0,
      totalSales: 0
    }));

    // Get customers for the selected date with branchId populated
    const customers = await Customer.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).populate("branchId", "name shortCode");

    // Calculate statistics
    customers.forEach(customer => {
      const branch = branchStats.find(b => b.branchId.toString() === customer.branchId._id.toString());

      if (branch) {
        branch.totalClients += 1;

        const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
        const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
        const totalCommission = (customer.cashCommission || 0) + (customer.onlineCommission || 0);

        // Assuming payCriteria logic is elsewhere, subtracting commission as before
        branch.totalSales += (totalCash + totalOnline - totalCommission);
      }
    });

    res.status(200).json(branchStats);
  } catch (error) {
    console.error("Error fetching branch statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

