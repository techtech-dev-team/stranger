const TID = require("../models/TID");
const mongoose = require("mongoose");

// Add new TID entry
exports.addTIDEntry = async (req, res) => {
  try {
    const { centreId, centreName, bankName, tidNumbers } = req.body;

    // Validate required fields
    if (!centreId || !centreName || !bankName || !Array.isArray(tidNumbers) || tidNumbers.length === 0) {
      return res.status(400).json({ message: "All fields are required, including at least one TID number with account name" });
    }

    // Validate each tidNumber object
    for (const item of tidNumbers) {
      if (!item.tid || !item.accountName) {
        return res.status(400).json({ message: "Each TID must have both 'tid' and 'accountName'" });
      }
    }

    // Check for duplicate centreId
    const existingTID = await TID.findOne({ centreId });
    if (existingTID) {
      return res.status(400).json({ message: "This centre is already listed with TID numbers" });
    }

    const newTID = new TID({ centreId, centreName, bankName, tidNumbers });
    await newTID.save();

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

// Update TID entry
exports.updateTIDEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tidNumbers, bankName, centreName } = req.body;

    const tidEntry = await TID.findById(id);
    if (!tidEntry) return res.status(404).json({ message: "TID entry not found" });

    if (tidNumbers) {
      // Validate tidNumbers array of objects
      if (!Array.isArray(tidNumbers)) {
        return res.status(400).json({ message: "'tidNumbers' must be an array of { tid, accountName } objects" });
      }

      for (const item of tidNumbers) {
        if (!item.tid || !item.accountName) {
          return res.status(400).json({ message: "Each TID must have both 'tid' and 'accountName'" });
        }
      }

      tidEntry.tidNumbers = tidNumbers;
    }

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

// Get TIDs by Centre
exports.getTIDsByCentre = async (req, res) => {
  try {
    const { centreId } = req.params;
    const tids = await TID.find({ centreId }).populate("centreId");
    res.status(200).json(tids);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch TIDs", error });
  }
};
