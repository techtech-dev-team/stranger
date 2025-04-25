const Customer = require('../models/Customer');
const Vision = require('../models/Vision');
const MissedEntry = require('../models/MissedEntry');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const moment = require('moment-timezone');

const sseClients = []; // To store SSE clients for live notifications

const checkMissedEntries = async () => {
  try {
    const fifteenMinutesAgo = moment().subtract(1, 'minutes').toDate(); // Adjusted to 15 mins as per requirement

    // **1. Check if Customer entry is missing**
    const unverifiedCustomers = await Customer.find({ createdAt: { $gte: fifteenMinutesAgo } });

    for (const customer of unverifiedCustomers) {
      const visionEntry = await Vision.findOne({
        time: {
          $gte: moment(customer.inTime).subtract(1, 'minutes').toISOString(),
          $lte: moment(customer.inTime).add(1, 'minutes').toISOString(),
        },
        nameOrCode: customer.number,
      });

      const missedEntry = await MissedEntry.findOne({ customerId: customer._id, visionId: visionEntry?._id });

      if (!visionEntry && !missedEntry) {
        // Vision Missed (Customer entry exists but no Vision entry)
        const visionManager = await User.findOne({ role: 'Vision', centreIds: customer.centreId });

        if (visionManager) {
          const message = `Missed Vision Entry for Customer: ${customer.name}`;
          sendNotification(visionManager._id, message);
          sendSSE({ type: 'MissedEntry', message }); // Send live notification
        }

        await MissedEntry.create({ customerId: customer._id, type: 'Vision Missed' });
      }

      if (visionEntry && !missedEntry) {
        // Centre Missed (Vision entry exists but no Customer entry)
        const centreManager = await User.findOne({ role: 'CM', centreIds: customer.centreId });

        if (centreManager) {
          const message = `Missed Centre Entry for Vision: ${visionEntry.nameOrCode}`;
          sendNotification(centreManager._id, message);
          sendSSE({ type: 'MissedEntry', message }); // Send live notification
        }

        await MissedEntry.create({ customerId: customer._id, visionId: visionEntry._id, type: 'Centre Missed' });
      }
    }

    // **2. Check if Vision entry exists but Customer entry is missing**
    const recentVisionEntries = await Vision.find({ time: { $gte: fifteenMinutesAgo } });

    for (const visionEntry of recentVisionEntries) {
      const customerEntry = await Customer.findOne({ number: visionEntry.nameOrCode, inTime: visionEntry.time });

      if (!customerEntry) {
        // If no matching customer entry found, log it as a "Customer Missed"
        const centreManager = await User.findOne({ role: 'CM', centreIds: visionEntry.centreId });

        if (centreManager) {
          const message = `Missed Customer Entry for Vision: ${visionEntry.nameOrCode}`;
          sendNotification(centreManager._id, message);
          sendSSE({ type: 'MissedEntry', message });
        }

        await MissedEntry.create({ visionId: visionEntry._id, type: 'Customer Missed' });
      }
    }

    console.log({ message: 'Missed entries checked' });
  } catch (error) {
    console.error('Error:', error);
  }
};

// Function to send SSE (Server-Sent Events)
const sendSSE = (data) => {
  sseClients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// SSE Endpoint to subscribe to live notifications
const sseHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push({ res });

  req.on('close', () => {
    sseClients.splice(sseClients.indexOf(res), 1);
  });
};


module.exports = { checkMissedEntries, sseHandler };
