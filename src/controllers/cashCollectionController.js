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
exports.getCashSummary = async (req, res) => {
  try {
    const { centreId, fromDate, toDate } = req.query;

    if (!centreId || !fromDate || !toDate) {
      return res.status(400).json({ message: "Centre ID, From Date, and To Date are required." });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // 1️⃣ Get the latest previous cash collection before 'fromDate'
    const lastCollection = await CashCollection.findOne({ 
      centreId, 
      amountReceivingDate: { $lt: from } // Find last collection before 'fromDate'
    }).sort({ amountReceivingDate: -1 });

    let previousBalance = 0;
    if (lastCollection) {
      previousBalance = lastCollection.amountReceived; // Cash left after last collection
    }

    // 2️⃣ Calculate total cash collected from customers between (last collection +1) and toDate
    const cashCollected = await Customer.aggregate([
      {
        $match: {
          centreId,
          inTime: { $gte: from, $lte: to } // Customers added in the date range
        }
      },
      {
        $group: {
          _id: null,
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } }
        }
      }
    ]);

    const cashCollection = cashCollected.length > 0 ? cashCollected[0].totalCash : 0;
    const total = previousBalance + cashCollection;

    res.status(200).json({
      message: "Cash summary retrieved successfully",
      previousBalance,
      cashCollection,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cash summary", error: error.message });
  }
};





