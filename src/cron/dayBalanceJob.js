const cron = require('node-cron');
const Centre = require('../models/Centre');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const CentreBalance = require('../models/centreBalance');

// Cron job to run every day at 7 AM
cron.schedule('0 7 * * *', async () => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Go back 1 day
    const dateStr = yesterday.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const start = new Date(`${dateStr}T00:00:00.000Z`);
    const end = new Date(`${dateStr}T23:59:59.999Z`);

    const centres = await Centre.find();

    for (const centre of centres) {
      const matchCondition = {
        centreId: centre._id,
        createdAt: { $gte: start, $lte: end }
      };

      const salesReport = await Customer.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
            totalCashCommission: { $sum: "$cashCommission" }
          }
        }
      ]);

      let totalCash = 0;
      let totalCashCommission = 0;

      if (salesReport.length > 0) {
        totalCash = salesReport[0].totalCash || 0;
        totalCashCommission = salesReport[0].totalCashCommission || 0;
      }

      const expenses = await Expense.find({
        centreIds: centre._id,
        createdAt: { $gte: start, $lte: end }
      }).lean();

      const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

      let dayBalance = 0;
      if (centre.payCriteria === 'plus') {
        dayBalance = totalCash + totalCashCommission;
      } else if (centre.payCriteria === 'minus') {
        dayBalance = totalCash;
      }

      // Optional: subtract expenses
      // dayBalance -= totalExpense;

      await CentreBalance.findOneAndUpdate(
        { centreId: centre._id, date: dateStr },
        { dayBalance },
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Day balance for ${dateStr} stored at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('❌ Cron Job Error:', err.message);
  }
});
