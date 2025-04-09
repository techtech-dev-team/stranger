const Customer = require('../models/Customer');
const Centre = require('../models/Centre');

const calculateSales = async (centreId, startDate, endDate) => {
  const centre = await Centre.findById(centreId);
  if (!centre) throw new Error('Centre not found');

  const payCriteria = centre.payCriteria;

  const customers = await Customer.find({
    centreId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  let totalCash = 0;
  let totalOnline = 0;

  customers.forEach((cust) => {
    if (payCriteria === 'plus') {
      totalCash += (cust.paymentCash1 || 0) + (cust.paymentCash2 || 0) - (cust.cashCommission || 0);
      totalOnline += (cust.paymentOnline1 || 0) + (cust.paymentOnline2 || 0) - (cust.onlineCommission || 0);
    } else {
      totalCash += (cust.paymentCash1 || 0) + (cust.paymentCash2 || 0);
      totalOnline += (cust.paymentOnline1 || 0) + (cust.paymentOnline2 || 0);
    }
  });

  return {
    totalCash,
    totalOnline,
    grandTotal: totalCash + totalOnline
  };
};

exports.getDailyGraph = async (req, res) => {
  try {
    const { centreId } = req.params;

    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const start = new Date(yesterday.setHours(0, 0, 0, 0));
    const end = new Date(yesterday.setHours(23, 59, 59, 999));

    const result = await calculateSales(centreId, start, end);
    res.json({ dateRange: 'Daily (Yesterday)', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWeeklyGraph = async (req, res) => {
  try {
    const { centreId } = req.params;

    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    const result = await calculateSales(centreId, start, end);
    res.json({ dateRange: 'Weekly (Last 7 Days)', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyGraph = async (req, res) => {
  try {
    const { centreId } = req.params;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    const result = await calculateSales(centreId, start, end);
    res.json({ dateRange: 'Monthly (1st to Yesterday)', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
