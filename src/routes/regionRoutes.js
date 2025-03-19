const express = require("express");
const { getAllRegions, getRegionById, addRegion, editRegion, deleteRegion } = require("../controllers/regionController");

const router = express.Router();

router.get("/", getAllRegions);
router.post("/add", addRegion); // Add region
router.get("/:id", getRegionById);
router.put("/edit/:id", editRegion); // Edit region
router.delete("/delete/:id", deleteRegion); // Delete region

module.exports = router;
