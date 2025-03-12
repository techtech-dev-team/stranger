const Branch = require("../models/Branch");

// @desc   Get all branches
// @route  GET /api/branches
// @access Public
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find({}).populate("regionId", "name"); // Populating regionId with region name
    if (!branches.length) {
      return res.status(404).json({ message: "No branches found" });
    }
    res.status(200).json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// @desc   Get a single branch by ID
// @route  GET /api/branches/:id
// @access Public
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate("regionId", "name");
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

