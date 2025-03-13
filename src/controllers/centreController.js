const Centre = require("../models/Centre");
const Customer = require("../models/Customer");
const mongoose = require('mongoose');
const moment = require('moment');

// @desc Get all centres
// @route GET /api/centres
// @access Public
exports.getAllCentres = async (req, res) => {
  try {
    const centres = await Centre.find({})
      .populate("branchId", "name shortCode") // Fetch branch name and short code
      .populate("regionId", "name"); // Fetch region name

    if (!centres.length) {
      return res.status(404).json({ message: "No centres found" });
    }
    res.status(200).json(centres);
  } catch (error) {
    console.error("Error fetching centres:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get a single centre by ID
// @route GET /api/centres/:id
// @access Public
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

// @desc Get inactive centres (no customer entry today)
// @route GET /api/centres/inactive
// @access Public
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

