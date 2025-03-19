const Region = require("../models/Region");
const Centre = require("../models/Centre");
const Customer = require("../models/Customer");
const moment = require("moment");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to initialize monthly data
const initializeMonthlyData = () => Array.from({ length: 12 }, (_, i) => ({
  month: moment().month(i).format("MMMM"),
  value: 0
}));

// Common function to get customers for a year and region
const getCustomersForYear = async (year, regionId) => {
  const startOfYear = moment().year(year).startOf("year").toDate();
  const endOfYear = moment().year(year).endOf("year").toDate();

  const query = { createdAt: { $gte: startOfYear, $lt: endOfYear } };
  if (regionId && isValidObjectId(regionId)) query.regionId = regionId;

  return Customer.find(query);
}

// API for Total Sales Monthly (3 months)
exports.getMonthlySales = async (req, res) => {
  try {
    const { regionId, year } = req.query;

    // Validate year, default to current year
    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    // Fetch customers for the year
    const customers = await getCustomersForYear(validYear, regionId);

    // Initialize sales data
    const monthlySales = initializeMonthlyData();

    // Calculate sales per month
    customers.forEach(customer => {
      const monthIndex = moment(customer.createdAt).month();
      const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
      const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
      const totalCommission = (customer.cashCommission || 0) + (customer.onlineCommission || 0);
      monthlySales[monthIndex].value += (totalCash + totalOnline - totalCommission);
    });

    res.status(200).json(monthlySales);
  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// API to get monthly clients
exports.getMonthlyClients = async (req, res) => {
  try {
    const { regionId, year } = req.query;

    // Validate year, default to current year
    const validYear = parseInt(year) || moment().year();
    if (isNaN(validYear)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    // Fetch customers for the year
    const customers = await getCustomersForYear(validYear, regionId);

    // Initialize clients data
    const monthlyClients = initializeMonthlyData();

    // Calculate clients per month
    customers.forEach(customer => {
      const monthIndex = moment(customer.createdAt).month();
      monthlyClients[monthIndex].value += 1;
    });

    res.status(200).json(monthlyClients);
  } catch (error) {
    console.error("Error fetching monthly clients:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRegionStatistics = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ message: "Invalid or missing date parameter" });
    }

    const startOfDay = moment(date).startOf("day").toDate();
    const endOfDay = moment(date).endOf("day").toDate();

    // Fetch all regions
    const regions = await Region.find({});
    if (!regions.length) {
      return res.status(404).json({ message: "No regions found" });
    }

    // Initialize stats per region
    const regionStats = regions.map(region => ({
      regionId: region._id,
      name: region.name,
      shortCode: region.short_code, // ✅ Added short code
      totalClients: 0,
      totalSales: 0
    }));

    // Get customers for the selected date with regionId populated
    const customers = await Customer.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).populate("regionId", "name short_code");

    // Calculate statistics
    customers.forEach(customer => {
      const region = regionStats.find(r => r.regionId.toString() === customer.regionId._id.toString());

      if (region) {
        region.totalClients += 1;

        const totalCash = (customer.paymentCash1 || 0) + (customer.paymentCash2 || 0);
        const totalOnline = (customer.paymentOnline1 || 0) + (customer.paymentOnline2 || 0);
        const totalCommission = (customer.cashCommission || 0) + (customer.onlineCommission || 0);

        // Assuming payCriteria logic is elsewhere, subtracting commission as before
        region.totalSales += (totalCash + totalOnline - totalCommission);
      }
    });

    res.status(200).json(regionStats);
  } catch (error) {
    console.error("Error fetching region statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllRegions = async (req, res) => {
  try {
    const regions = await Region.find({});
    if (!regions.length) {
      return res.status(404).json({ message: "No regions found" });
    }
    res.status(200).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// In regionController.js
exports.addRegion = async (req, res) => {
  const { name, shortCode } = req.body;
  try {
      const region = new Region({ name, shortCode });
      await region.save();
      res.status(201).json({ message: "Region added successfully", region });
  } catch (error) {
      console.error("Error adding region:", error);
      res.status(500).json({ message: "Server error" });
  }
};

exports.editRegion = async (req, res) => {
  const { name, shortCode } = req.body;
  try {
      const region = await Region.findByIdAndUpdate(
          req.params.id,
          { name, shortCode },
          { new: true }
      );
      if (!region) {
          return res.status(404).json({ message: "Region not found" });
      }
      res.status(200).json({ message: "Region updated successfully", region });
  } catch (error) {
      console.error("Error updating region:", error);
      res.status(500).json({ message: "Server error" });
  }
};

exports.deleteRegion = async (req, res) => {
  try {
      const region = await Region.findByIdAndDelete(req.params.id);
      if (!region) {
          return res.status(404).json({ message: "Region not found" });
      }
      res.status(200).json({ message: "Region deleted successfully" });
  } catch (error) {
      console.error("Error deleting region:", error);
      res.status(500).json({ message: "Server error" });
  }
};
exports.getRegionById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid Region ID' });
  }

  try {
    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }
    res.json(region);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



