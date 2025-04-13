const TID = require("../models/TID");
const mongoose = require("mongoose");

// Add new TID entry
exports.addTIDEntry = async (req, res) => {
  try {
    const { centreId, centreName, bankName, tidNumbers } = req.body;

    if (!centreId || !centreName || !bankName || !tidNumbers?.length) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newTID = new TID({ centreId, centreName, bankName, tidNumbers });
    await newTID.save();

    // Populate the centreId field after saving
    const populatedTID = await TID.findById(newTID._id).populate("centreId");

    res.status(201).json({
      message: "TID entry added successfully",
      tid: populatedTID,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding TID entry", error: error.message });
  }
};


// Get all TID entries
exports.getAllTIDs = async (req, res) => {
  try {
    const tids = await TID.find().populate("centreId");
    res.json({ tids });
  } catch (error) {
    res.status(500).json({ message: "Error fetching TID entries", error: error.message });
  }
};

// Update TID entry (Add, Remove or Change TID Numbers, or update bank/centre name)
exports.updateTIDEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tidNumbers, bankName, centreName } = req.body;

    const tidEntry = await TID.findById(id);
    if (!tidEntry) return res.status(404).json({ message: "TID entry not found" });

    if (tidNumbers) tidEntry.tidNumbers = tidNumbers;
    if (bankName) tidEntry.bankName = bankName;
    if (centreName) tidEntry.centreName = centreName;

    await tidEntry.save();
    res.json({ message: "TID entry updated successfully", tid: tidEntry });
  } catch (error) {
    res.status(500).json({ message: "Error updating TID entry", error: error.message });
  }
};

// Delete TID entry
exports.deleteTIDEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TID.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "TID entry not found" });

    res.json({ message: "TID entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting TID entry", error: error.message });
  }
};
