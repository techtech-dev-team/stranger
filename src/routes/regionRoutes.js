const express = require("express");
const { getAllRegions, getRegionById , getRegionStatistics , getMonthlySales , getMonthlyClients , addRegion , editRegion , deleteRegion  } = require("../controllers/regionController");

const router = express.Router();
router.get("/statistics/data", getRegionStatistics);
router.get("/monthly-sales", getMonthlySales);
router.get("/monthly-clients", getMonthlyClients);
router.get("/", getAllRegions);
router.post("/add", addRegion);
router.get("/:id", getRegionById);
router.put("/edit/:id", editRegion);
router.delete("/delete/:id", deleteRegion);

module.exports = router;
 