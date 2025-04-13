const express = require("express");
const router = express.Router();
const {
  addTIDEntry,
  getAllTIDs,
  updateTIDEntry,
  deleteTIDEntry,
  getTIDsByCentre
} = require("../controllers/tidController");

// POST: Add new TID entry
router.post("/", addTIDEntry);

// GET: Fetch all TID entries
router.get("/", getAllTIDs);

// PUT: Update TID entry (add/remove/change TIDs, change bank/centre name)
router.put("/:id", updateTIDEntry);

// DELETE: Delete TID entry
router.delete("/:id", deleteTIDEntry);

router.get("/by-centre/:centreId", getTIDsByCentre);

module.exports = router;
