const CashCollection = require("../models/cashCollection");
const Customer = require("../models/Customer");


// Add a new cash collection entry
exports.addCashCollection = async (req, res) => {
  try {
    const { centreId, amountReceived, fromDate, toDate, amountReceivingDate, remark } = req.body;

    if (!centreId || !amountReceived || !fromDate || !toDate || !amountReceivingDate) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const newEntry = new CashCollection({
      centreId,
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
    const collections = await CashCollection.find({ centreId }).sort({ amountReceivingDate: -1 });

    if (collections.length === 0) {
      return res.status(404).json({ message: "No cash collection records found for this centre." });
    }

    res.status(200).json({ message: "Cash collection records retrieved successfully.", data: collections });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cash collection records.", error: error.message });
  }
};

// Get cash collection summary for a centre






