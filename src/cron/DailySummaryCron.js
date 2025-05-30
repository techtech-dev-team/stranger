
const cron = require("node-cron");
const moment = require("moment-timezone");
const DailySummary = require("../models/DailySummary");
const Customer = require("../models/Customer");
const Expense = require("../models/Expense");

// Schedule: 7:00 AM IST every day
cron.schedule("0 7 * * *", async () => {
  try {
    const nowIST = moment.tz("Asia/Kolkata");
    // Store summary for previous IST day
    const summaryDate = nowIST.clone().subtract(1, "day").startOf("day").toDate();
    const istDateString = nowIST.clone().subtract(1, "day").format("YYYY-MM-DD");

    // 7:00 AM previous day to 6:59:59 AM today (IST)
    const rangeStart = nowIST.clone().subtract(1, "day").startOf("day").add(7, "hours").toDate();
    const rangeEnd = nowIST.clone().startOf("day").add(6, "hours").add(59, "minutes").add(59, "seconds").add(999, "milliseconds").toDate();

    // Aggregate customer data per centre, including customerCount
    const customerAgg = await Customer.aggregate([
      {
        $match: {
          inTime: { $gte: rangeStart, $lte: rangeEnd }
        }
      },
     {
  $group: {
    _id: "$centreId",
    totalCash: {
      $sum: {
        $add: [
          { $ifNull: ["$paymentCash1", 0] },
          { $ifNull: ["$paymentCash2", 0] }
        ]
      }
    },
    totalOnline: {
      $sum: {
        $add: [
          { $ifNull: ["$paymentOnline1", 0] },
          { $ifNull: ["$paymentOnline2", 0] }
        ]
      }
    },
    totalCashCommission: { $sum: { $ifNull: ["$cashCommission", 0] } },
    totalOnlineCommission: { $sum: { $ifNull: ["$onlineCommission", 0] } },
    customerCount: { $sum: 1 }
  }
}
    ]);

    // Aggregate expenses per centre in the same window
    const expenseAgg = await Expense.aggregate([
      {
        $match: {
          expenseDate: { $gte: rangeStart, $lte: rangeEnd }
        }
      },
      { $unwind: "$centreIds" },
      {
        $group: {
          _id: "$centreIds",
          totalExpense: { $sum: "$amount" }
        }
      }
    ]);

    // Map expenses by centreId for quick lookup
    const expenseMap = {};
    expenseAgg.forEach(e => {
      expenseMap[e._id.toString()] = e.totalExpense;
    });

    // Collect all unique centreIds from both customer and expense aggregation
    const centreIds = new Set([
      ...customerAgg.map(c => c._id && c._id.toString()),
      ...expenseAgg.map(e => e._id && e._id.toString())
    ]);

    // Save or update daily summary per centre
    for (const centreId of centreIds) {
      const c = customerAgg.find(x => x._id && x._id.toString() === centreId) || {};
      const totalExpense = expenseMap[centreId] || 0;

      await DailySummary.findOneAndUpdate(
        { istDateString, centreId },
        {
          $set: {
            date: summaryDate,
            istDateString,
            centreId,
            totalCash: c.totalCash || 0,
            totalOnline: c.totalOnline || 0,
            totalCashCommission: c.totalCashCommission || 0,
            totalOnlineCommission: c.totalOnlineCommission || 0,
            totalExpense,
            customerCount: c.customerCount || 0
          }
        },
        { upsert: true, new: true }
      );
    }
    
  } catch (err) {
    console.error("Error in daily summary cron job:", err);
  }
}, {
  timezone: "Asia/Kolkata"
});