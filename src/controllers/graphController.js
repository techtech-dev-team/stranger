const Customer = require('../models/Customer');
const Centre = require('../models/Centre');

const calculateSales = async (centreId, startDate, endDate) => {
  const centre = await Centre.findById(centreId);
  if (!centre) throw new Error('Centre not found');

  const payCriteria = centre.payCriteria;

  // Fetch all customers in the date range
  const customers = await Customer.find({
    centreId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // Group by date
  const salesByDate = {};

  customers.forEach((cust) => {
    const dateKey = cust.createdAt.toISOString().split('T')[0];

    if (!salesByDate[dateKey]) {
      salesByDate[dateKey] = {
        totalCash: 0,
        totalOnline: 0,
      };
    }

    const cash1 = cust.paymentCash1 || 0;
    const cash2 = cust.paymentCash2 || 0;
    const online1 = cust.paymentOnline1 || 0;
    const online2 = cust.paymentOnline2 || 0;
    const cashComm = cust.cashCommission || 0;
    const onlineComm = cust.onlineCommission || 0;

    if (payCriteria === 'plus') {
      salesByDate[dateKey].totalCash += cash1 + cash2 - cashComm;
      salesByDate[dateKey].totalOnline += online1 + online2 - onlineComm;
    } else {
      salesByDate[dateKey].totalCash += cash1 + cash2;
      salesByDate[dateKey].totalOnline += online1 + online2;
    }

    salesByDate[dateKey].totalCommission += cashComm + onlineComm;
  });

  // Format into array
  const salesData = Object.keys(salesByDate).sort().map(date => ({
    _id: date,
    ...salesByDate[date]
  }));

  return salesData;
};

// 📅 DAILY GRAPH (yesterday)
exports.getDailyGraph = async (req, res) => {
  try {
    const { centreId } = req.params;

    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const start = new Date(yesterday.setHours(0, 0, 0, 0));
    const end = new Date(yesterday.setHours(23, 59, 59, 999));

    const salesData = await calculateSales(centreId, start, end);
    res.json({ dateRange: 'Daily (Yesterday)', salesData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📈 WEEKLY GRAPH (last 7 days)
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

    const salesData = await calculateSales(centreId, start, end);
    res.json({ salesData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📆 MONTHLY GRAPH (1st to yesterday)
exports.getMonthlyGraph = async (req, res) => {
  try {
    const { centreId } = req.params;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    const salesData = await calculateSales(centreId, start, end);
    res.json({ dateRange: 'Monthly (1st to Yesterday)', salesData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
