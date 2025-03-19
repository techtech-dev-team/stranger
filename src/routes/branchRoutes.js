const express = require("express");
const { getAllBranches, getBranchById, getMonthlySalesByBranch, getMonthlyClientsByBranch , getCombinedMonthlySales , getCombinedMonthlyClients } = require("../controllers/branchController");

const router = express.Router();

router.get("/combined-sales", getCombinedMonthlySales);
router.get("/combined-clients", getCombinedMonthlyClients);
router.get("/monthly-sales", getMonthlySalesByBranch);
router.get("/monthly-clients", getMonthlyClientsByBranch);
router.get("/", getAllBranches);
router.get("/:id", getBranchById);


module.exports = router;
