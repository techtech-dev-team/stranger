const CashCollection = require("../models/cashCollection");

// Add a new cash collection entry
exports.addCashCollection = async (req, res) => {
  try {
    const { centreId, regionId, branchId, amountReceived, fromDate, toDate, amountReceivingDate, remark } = req.body;

    if (!centreId || !regionId || !branchId || !amountReceived || !fromDate || !toDate || !amountReceivingDate) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const newEntry = new CashCollection({
      centreId,
      regionId,
      branchId,
      amountReceived,
      fromDate,
      toDate,
      amountReceivingDate,
      remark
    });

    await newEntry.save();
    res.status(201).json({ message: "Cash collection recorded successfully.", data: newEntry });
  } catch (error) {
    res.status(500).json({ message: "Error adding cash collection.", error: error.message });
  }
};

// Get cash collection records for a specific centre
exports.getCashCollections = async (req, res) => {
  try {
    const { centreId } = req.params;
    const collections = await CashCollection.find({ centreId })
      .populate("regionId branchId centreId") // Populate region, branch, and centre details
      .sort({ amountReceivingDate: -1 });

    if (collections.length === 0) {
      return res.status(404).json({ message: "No cash collection records found for this centre." });
    }

    res.status(200).json({ message: "Cash collection records retrieved successfully.", data: collections });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cash collection records.", error: error.message });
  }
};

// Get cash collection summary for a specific region and branch
exports.getCashSummary = async (req, res) => {
  try {
    const { regionId, branchId } = req.query;

    const filter = {};
    if (regionId) filter.regionId = regionId;
    if (branchId) filter.branchId = branchId;

    const summary = await CashCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amountReceived" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      message: "Cash collection summary retrieved successfully.",
      data: summary.length > 0 ? summary[0] : { totalAmount: 0, count: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cash collection summary.", error: error.message });
  }
};
