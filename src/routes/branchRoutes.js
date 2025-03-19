const express = require("express");
const { getAllBranches, getMonthlySalesByBranch, getMonthlyClientsByBranch , getCombinedMonthlySales , getCombinedMonthlyClients,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch } = require("../controllers/branchController");

const router = express.Router();

router.get("/combined-sales", getCombinedMonthlySales);
router.get("/combined-clients", getCombinedMonthlyClients);
router.get("/monthly-sales", getMonthlySalesByBranch);
router.get("/monthly-clients", getMonthlyClientsByBranch);
router.get("/", getAllBranches);

// @route  GET /api/branches/:id
// @desc   Get a branch by ID
// @access Public
router.get("/:id", getBranchById);
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
