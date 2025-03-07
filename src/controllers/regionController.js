const Region = require("../models/Region");

// @desc   Get all regions
// @route  GET /api/regions
// @access Public
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

// @desc   Get a single region by ID
// @route  GET /api/regions/:id
// @access Public
exports.getRegionById = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }
    res.status(200).json(region);
  } catch (error) {
    console.error("Error fetching region:", error);
    res.status(500).json({ message: "Server error" });
  }
};
