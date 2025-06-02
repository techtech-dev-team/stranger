const express = require("express");
const {
  submitCash,
  getAllSubmissions,
  getSubmissionsBySubmittedTo,
  getSubmissionsBySubmittedBy,
} = require("../controllers/submittedCashController");

const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // Adjust path if needed
router.post("/submit", protect,submitCash); // Submit cash
router.get("/all", getAllSubmissions); // Get all submissions
router.get("/submittedTo/:userId", getSubmissionsBySubmittedTo); // Get submissions by submittedTo
router.get("/submittedBy/:userId", getSubmissionsBySubmittedBy); // Get submissions by submittedBy

module.exports = router;