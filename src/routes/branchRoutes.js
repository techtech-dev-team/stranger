const express = require("express");
const { getAllBranches, getBranchById, getMonthlySalesByBranch, getMonthlyClientsByBranch , getCombinedMonthlySales , getCombinedMonthlyClients } = require("../controllers/branchController");

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


module.exports = router;
