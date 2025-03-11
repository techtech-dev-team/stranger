const express = require("express");
const router = express.Router();
const { getCashCollections, addCashCollection, getCashSummary } = require("../controllers/cashCollectionController");

// Route to add cash collection entry
router.post("/cash-collection", addCashCollection);

// Route to get cash collection entries for a specific centre
router.get("/cash-collection/:centreId", getCashCollections);

// Route to get cash collection summary for a region or branch
router.get("/cash-collection-summary", getCashSummary);

module.exports = router;
