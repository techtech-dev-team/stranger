const express = require("express");
const router = express.Router();
const { getAllRegionsBranchesCentres } = require("../controllers/regionBranchCentreController");

// ✅ New Route - Get All Regions, Branches, and Centres
router.get("/all", getAllRegionsBranchesCentres);

module.exports = router;
