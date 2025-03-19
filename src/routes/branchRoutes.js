const express = require("express");
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
} = require("../controllers/branchController");

const router = express.Router();

// @route  GET /api/branches
// @desc   Get all branches
// @access Public
router.get("/", getAllBranches);

// @route  GET /api/branches/:id
// @desc   Get a branch by ID
// @access Public
router.get("/:id", getBranchById);

// @route  POST /api/branches
// @desc   Create a new branch
// @access Private
router.post("/", createBranch);

// @route  PUT /api/branches/:id
// @desc   Update a branch by ID
// @access Private
router.put("/:id", updateBranch);

// @route  DELETE /api/branches/:id
// @desc   Delete a branch by ID
// @access Private
router.delete("/:id", deleteBranch);

module.exports = router;
