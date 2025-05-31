const CashCollection = require("../models/cashCollection");
const User = require("../models/User");
const Centre = require("../models/Centre");

const clients = []; // Store SSE clients

// SSE Handler
exports.sseHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
  });
};

// Function to send SSE events
const sendSSEEvent = (data) => {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Add a new cash collection entry
exports.addCashCollection = async (req, res) => {
  try {
    const { centreId, regionId, branchId, amountReceived, fromDate, toDate, amountReceivingDate, remark } = req.body;

    if (!centreId || !regionId || !branchId || !amountReceived || !amountReceivingDate) {
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

    // Update user's cashInHand
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.cashInHand = (user.cashInHand || 0) + amountReceived;
    await user.save();

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

    // Send SSE event
    sendSSEEvent({ message: "New cash collection recorded", data: newEntry });

    res.status(201).json({
      message: "Cash collection recorded successfully.",
      data: newEntry,
      previousBalance,
      balance: newBalance,
      userCashInHand: user.cashInHand,
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
      .select("amountReceived fromDate toDate amountReceivingDate userId remark")
      .populate("userId", "name"); // Populate user's name and loginId

    const formattedHistory = history.map((item) => ({
      amount: item.amountReceived,
      duration: `${new Date(item.fromDate).toLocaleDateString()} - ${new Date(item.toDate).toLocaleDateString()}`,
      collectionDate: new Date(item.amountReceivingDate).toLocaleDateString(),
      postedBy: item.userId ? `${item.userId.name}` : "Unknown", // Show user info
      remark: item.remark,
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

exports.toggleVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params; // CashCollection ID
    const { field } = req.body; // 'OT' or 'RM'

    if (!['OT', 'RM'].includes(field)) {
      return res.status(400).json({ message: "Invalid field. Must be 'OT' or 'RM'." });
    }

    const entry = await CashCollection.findById(id);
    if (!entry) {
      return res.status(404).json({ message: "Cash collection entry not found." });
    }

    // Toggle the status
    entry[field] = entry[field] === "Verified" ? "Unverified" : "Verified";
    await entry.save();

    res.status(200).json({
      message: `${field} verification status toggled successfully.`,
      data: {
        id: entry._id,
        field,
        newStatus: entry[field],
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating verification status.", error: error.message });
  }
};

