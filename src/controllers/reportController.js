const Customer = require('../models/Customer');

const getDailyReport = async (req, res) => {
  try {
    // Get date from query or use today's date
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(reportDate);
    nextDay.setDate(reportDate.getDate() + 1);

    // Fetch all transactions for the given date
    const transactions = await Customer.find({
      createdAt: { $gte: reportDate, $lt: nextDay },
    });

    // Initialize totals
    let totalCashCollected = 0;
    let totalOnlineCollected = 0;
    let cashCommissionTotal = 0;
    let onlineCommissionTotal = 0;

    // Calculate totals
    transactions.forEach((transaction) => {
      totalCashCollected += transaction.paymentCash1 + transaction.paymentCash2;
      totalOnlineCollected += transaction.paymentOnline1 + transaction.paymentOnline2;
      cashCommissionTotal += transaction.cashCommission;
      onlineCommissionTotal += transaction.onlineCommission;
    });

    // Calculate final total after deducting commissions
    const grandTotal = totalCashCollected + totalOnlineCollected - onlineCommissionTotal;

    res.status(200).json({
      date: reportDate.toISOString().split('T')[0],
      totalCashCollected,
      totalOnlineCollected,
      cashCommissionTotal,
      onlineCommissionTotal,
      grandTotal,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDailyReport };
