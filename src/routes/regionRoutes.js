const express = require("express");
const { getAllRegions, getRegionById , getRegionStatistics , getMonthlySales , getMonthlyClients } = require("../controllers/regionController");

const router = express.Router();
router.get("/statistics/data", getRegionStatistics);
router.get("/monthly-sales", getMonthlySales);
router.get("/monthly-clients", getMonthlyClients);
router.get("/", getAllRegions);
router.get("/:id", getRegionById);

module.exports = router;
