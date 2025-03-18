const CashCollection = require("../models/cashCollection");
const User = require("../models/User");
const Centre = require("../models/Centre");
// Add a new cash collection entry
exports.addCashCollection = async (req, res) => {
  try {
    const { centreId, regionId, branchId, amountReceived, fromDate, toDate, amountReceivingDate, remark } = req.body;

    if (!centreId || !regionId || !branchId || !amountReceived || !fromDate || !toDate || !amountReceivingDate) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    // Fetch Centre details
    const centre = await Centre.findById(centreId);
    if (!centre) return res.status(404).json({ message: "Centre not found." });

    // Correct calculation:
    const previousBalance = centre.balance - amountReceived + centre.previousBalance;

    // Reset balance after cash collection
    const newBalance = 0;

    // Update Centre
    await Centre.findByIdAndUpdate(centreId, {
      previousBalance: previousBalance,
      balance: newBalance,
    });

    // Create cash collection entry
    const newEntry = new CashCollection({
      centreId,
      regionId,
      branchId,
      amountReceived,
      fromDate,
      toDate,
      amountReceivingDate,
      remark,
      userId,
    });

    await newEntry.save();

    res.status(201).json({
      message: "Cash collection recorded successfully.",
      data: newEntry,
      previousBalance,
      balance: newBalance,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding cash collection.", error: error.message });
  }
};

exports.getCashCollections = async (req, res) => {
  try {
    const { centreId } = req.params;
    const query = centreId ? { centreId } : {}; // Fetch all if no centreId is provided

    const collections = await CashCollection.find(query)
      .populate("regionId branchId centreId userId")
      .sort({ amountReceivingDate: -1 });

    if (collections.length === 0) {
      return res.status(404).json({ message: "No cash collection records found." });
    }

    res.status(200).json({ message: "Cash collection records retrieved successfully.", data: collections });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cash collection records.", error: error.message });
  }
};


exports.getCashCollectionHistory = async (req, res) => {
  try {
    const { regionId, branchId } = req.query;

    const filter = {};
    if (regionId) filter.regionId = regionId;
    if (branchId) filter.branchId = branchId;

    // Fetch history with user populated
    const history = await CashCollection.find(filter)
      .select("amountReceived fromDate toDate amountReceivingDate userId")
      .populate("userId", "name"); // Populate user's name and loginId

    const formattedHistory = history.map((item) => ({
      amount: item.amountReceived,
      duration: `${new Date(item.fromDate).toLocaleDateString()} - ${new Date(item.toDate).toLocaleDateString()}`,
      collectionDate: new Date(item.amountReceivingDate).toLocaleDateString(),
      postedBy: item.userId ? `${item.userId.name}` : "Unknown", // Show user info
    }));

    res.status(200).json({
      message: "Cash collection history retrieved successfully.",
      data: formattedHistory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving cash collection history.",
      error: error.message,
    });
  }
};

