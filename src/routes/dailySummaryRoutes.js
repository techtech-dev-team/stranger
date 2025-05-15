const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const DailySummary = require("../models/DailySummary");

router.get("/daily-summary/:date", async (req, res) => {
    try {
        const { date } = req.params;

        const summaries = await DailySummary.find({
            istDateString: date,
        }).populate('centreId');

        if (!summaries || summaries.length === 0) {
            return res
                .status(404)
                .json({ message: "No summaries found for this date." });
        }
        res.json(summaries);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;