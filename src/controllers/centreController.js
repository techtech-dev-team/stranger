const Centre = require("../models/Centre");
const Customer = require("../models/Customer");
const mongoose = require('mongoose');
const moment = require('moment');



// @desc   Get all centres
// @route  GET /api/centres
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


// @desc   Get a single centre by ID


exports.getCentreById = async (req, res) => {
  try {
    const { id } = req.params;
    let centre;

    if (id === "inactive") {
      // Fetch all inactive centres
      centre = await Centre.find({ status: "inactive" })
        .populate("branchId", "name shortCode")
        .populate("regionId", "name");
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

    if (!centre || (Array.isArray(centre) && centre.length === 0)) {
      return res.status(404).json({ message: "Centre not found" });
    }

    res.status(200).json(centre);
  } catch (error) {
    console.error("Error fetching centre:", error);
    res.status(500).json({ message: "Server error" });
  }
};




// @desc   Get inactive centres (no customer entry today)
// @route  GET /api/centres/inactive

exports.getInactiveCentres = async (req, res) => {
  try {
    // Step 1: Get today's date at the start of the day (UTC)
    const today = moment().startOf('day').toDate();

    // Step 2: Find centres with entries today (centreId stored as string)
    const activeCentreIds = await Customer.distinct('centreId', {
      createdAt: { $gte: today },
    });

    console.log("Active Centres Today:", activeCentreIds);

    // Step 3: Get inactive centres (compare as string)
    const inactiveCentres = await Centre.find({
      centreId: { $nin: activeCentreIds },  // Compare centreId as string
    })
      .populate("branchId", "name shortCode")
      .populate("regionId", "name");

    if (inactiveCentres.length === 0) {
      return res.status(404).json({ message: "No inactive centres found" });
    }

    res.status(200).json(inactiveCentres);
  } catch (error) {
    console.error("Error fetching inactive centres:", error);
    res.status(500).json({ message: "Server error" });
  }
};


