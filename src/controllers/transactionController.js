const Transaction = require("../models/Transaction");
const TID = require("../models/TID");
const Centre = require("../models/Centre");

exports.createTransaction = async (req, res) => {
  try {
    const { tidNumber, amount } = req.body;

    if (!tidNumber || !amount) {
      return res.status(400).json({ message: "TID number and amount are required" });
    }

    // Find TID entry using tidNumber
    const tidEntry = await TID.findOne({ tidNumbers: tidNumber });
    if (!tidEntry) {
      return res.status(404).json({ message: "TID number not found" });
    }

    // Get the centre info
    const centre = await Centre.findById(tidEntry.centreId);
    if (!centre) {
      return res.status(404).json({ message: "Centre not found for TID" });
    }

    const newTransaction = new Transaction({
      tidNumber,
      amount,
      bankName: tidEntry.bankName,
      centreId: centre._id,
      centreName: centre.name,
      branchId: centre.branchId,
      regionId: centre.regionId,
    });

    await newTransaction.save();

    res.status(201).json({
      message: "Transaction saved successfully",
      transaction: newTransaction,
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving transaction", error: error.message });
  }
};
