const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const DailySummary = require("../models/DailySummary");

router.get("/daily-summary/:centreId/:date", async (req, res) => {
    try {
        const { centreId, date } = req.params;

        const summary = await DailySummary.findOne({
            centreId: new mongoose.Types.ObjectId(centreId),
            istDateString: date,
        }).populate('centreId');

        if (!summary) {
            return res
                .status(404)
                .json({ message: "No summary found for this centre and date." });
        }
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;