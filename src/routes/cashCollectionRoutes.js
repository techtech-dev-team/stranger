const express = require("express");
const router = express.Router();
const { getCashCollections  , addCashCollection , getCashSummary } = require("../controllers/cashCollectionController");

// Route to add cash collection entry
router.post("/cash-collection", addCashCollection);

// Route to get cash collection entries for a specific centre
router.get("/cash-collection/:centreId", getCashCollections);

module.exports = router;
