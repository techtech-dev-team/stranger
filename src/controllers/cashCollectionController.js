const CashCollection = require("../models/cashCollection");

// Add a new cash collection entry
exports.addCashCollection = async (req, res) => {
  try {
    const { centreId, regionId, branchId, amountReceived, fromDate, toDate, amountReceivingDate, remark } = req.body;

    // Check required fields
    if (!centreId || !regionId || !branchId || !amountReceived || !fromDate || !toDate || !amountReceivingDate) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Extract userId from the token (added automatically by authMiddleware)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    // Create new entry
    const newEntry = new CashCollection({
      centreId,
      regionId,
      branchId,
      amountReceived,
      fromDate,
      toDate,
      amountReceivingDate,
      remark,
      userId,  // Automatically added
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
// Get cash collection history for a specific region and branch
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

