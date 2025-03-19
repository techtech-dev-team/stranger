const Region = require("../models/Region");
const Branch = require("../models/Branch");
const Centre = require("../models/Centre");

// ✅ Get All Regions, Branches, and Centres Together
exports.getAllRegionsBranchesCentres = async (req, res) => {
  try {
    const regions = await Region.find();
    const branches = await Branch.find();
    const centres = await Centre.find();

    res.json({
      regions,
      branches,
      centres,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching regions, branches, and centres",
      error: error.message,
    });
  }
};
