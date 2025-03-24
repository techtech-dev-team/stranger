const express = require("express");
const { getAllBranches, getMonthlySalesByBranch, getMonthlyClientsByBranch , getCombinedMonthlySales , getCombinedMonthlyClients,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchStatistics } = require("../controllers/branchController");

const router = express.Router();

router.get("/branch-stats", getBranchStatistics);
router.get("/combined-sales", getCombinedMonthlySales);
router.get("/combined-clients", getCombinedMonthlyClients);
router.get("/monthly-sales", getMonthlySalesByBranch);
router.get("/monthly-clients", getMonthlyClientsByBranch);
router.get("/", getAllBranches);
router.get("/:id", getBranchById);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);

module.exports = router;
