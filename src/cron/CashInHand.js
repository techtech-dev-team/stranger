const mongoose = require("mongoose");
const CashCollection = require("../models/cashCollection");
const User = require("../models/User");
const cron = require("node-cron");

const updateCashInHand = async () => {
  try {
    console.log("Cron job started: Summing up cash collections...");

    // Aggregate cash collections: group by userId and sum amountReceived
    const aggregatedCollections = await CashCollection.aggregate([
      {
        $group: {
          _id: "$userId",
          totalAmountReceived: { $sum: "$amountReceived" }
        }
      }
    ]);

    console.log("Aggregated cash collections:", aggregatedCollections);

    // Update each user's cashInHand ONCE
    for (const { _id: userId, totalAmountReceived } of aggregatedCollections) {
      // Reset cashInHand to 0
      await User.updateOne(
        { _id: userId },
        { $set: { cashInHand: 0 } }
      );

      // Increment cashInHand with the new totalAmountReceived
      const result = await User.updateOne(
        { _id: userId },
        { $inc: { cashInHand: totalAmountReceived } }
      );

      if (result.matchedCount > 0) {
        console.log(`Updated cashInHand for user ${userId} by total ${totalAmountReceived}.`);
      } else {
        console.warn(`User with ID ${userId} not found.`);
      }
    }

    console.log("Cron job completed: cashInHand updated with total amounts.");
  } catch (error) {
    console.error("Error in cron job:", error);
  }
};

cron.schedule(
    "53 10 * * *", // Schedule for 10:53 AM IST
    async () => {
    console.log("Scheduled cron job triggered at 9 PM IST.");
    await updateCashInHand();
  },
  { timezone: "Asia/Kolkata" }
);

module.exports = updateCashInHand;