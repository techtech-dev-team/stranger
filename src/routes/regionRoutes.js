const express = require("express");
const { getAllRegions, getRegionById } = require("../controllers/regionController");

const router = express.Router();

router.get("/", getAllRegions);
router.get("/:id", getRegionById);

module.exports = router;
