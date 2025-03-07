const Centre = require("../models/Centre");

// @desc   Get all centres
// @route  GET /api/centres
// @access Public
exports.getAllCentres = async (req, res) => {
  try {
    const centres = await Centre.find({});
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
// @route  GET /api/centres/:id
// @access Public
exports.getCentreById = async (req, res) => {
  try {
    const centre = await Centre.findById(req.params.id);
    if (!centre) {
      return res.status(404).json({ message: "Centre not found" });
    }
    res.status(200).json(centre);
  } catch (error) {
    console.error("Error fetching centre:", error);
    res.status(500).json({ message: "Server error" });
  }
};
