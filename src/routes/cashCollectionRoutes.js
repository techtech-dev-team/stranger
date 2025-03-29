const express = require("express");
const router = express.Router();
const { getCashCollections, addCashCollection, getCashCollectionHistory, sseHandler } = require("../controllers/cashCollectionController");

// SSE Route for real-time updates
router.get("/sse", sseHandler);

router.get("/cash-collection", getCashCollections);
router.post("/cash-collection", addCashCollection);
router.get("/cash-collection-summary", getCashCollectionHistory);
router.get("/cash-collection/:centreId", getCashCollections);

module.exports = router;
