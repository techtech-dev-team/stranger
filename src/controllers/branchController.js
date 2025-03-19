const Branch = require("../models/Branch");
const Region = require("../models/Region");

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

// @desc   Get a branch by ID
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

// @desc   Create a new branch
// @route  POST /api/branches
// @access Private
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
