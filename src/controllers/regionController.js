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
