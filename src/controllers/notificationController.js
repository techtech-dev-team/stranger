const Customer = require('../models/Customer');
const Vision = require('../models/Vision');
const MissedEntry = require('../models/MissedEntry');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const moment = require('moment-timezone');

// SSE function to broadcast messages to all connected clients
const clients = []; // Array to keep track of connected clients for SSE

const sendSSEToAll = (data) => {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Register new SSE client connections
const registerSSEClient = (req, res) => {
  console.log('New SSE client connection received');
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader('Content-Encoding', 'identity'); // Disable compression to avoid chunking issues
  res.flushHeaders(); // Immediately flush headers

  // Add this client to the list
  clients.push({ req, res });

  // Handle client disconnection
  req.on("close", () => {
    console.log('SSE client disconnected');
    const index = clients.findIndex(client => client.req === req);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
};

// Missed entry check function
const checkMissedEntries = async () => {
  try {
    const twoMinutesAgo = moment().subtract(2, 'minutes').toDate();
    console.log(`Checking missed entries since: ${twoMinutesAgo}`);

    // --- 1. Customer Entries ---
    const recentCustomers = await Customer.find({ createdAt: { $gte: twoMinutesAgo } });
    console.log(`Found ${recentCustomers.length} recent customer entries.`);

    for (const customer of recentCustomers) {
      console.log(`Checking customer: ${customer.name} (${customer.number || 'No number'})`);

      const visionEntry = await Vision.findOne({
        centreId: customer.centreId,
        time: {
          $gte: moment(customer.inTime).subtract(2, 'minutes').toISOString(),
          $lte: moment(customer.inTime).add(2, 'minutes').toISOString(),
        },
      });

      if (!visionEntry) {
        console.log(`❌ Vision entry missing for ${customer.name}`);

        // Send SSE to all connected clients immediately
        sendSSEToAll({
          type: 'MissedEntry',
          message: `Vision entry missing for ${customer.name}`,
          customerId: customer._id,
          customerName: customer.name,
          centreId: customer.centreId,
        });

        console.log(`Sent SSE for missed vision entry of ${customer.name}`);
      }
    }

    // --- 2. Vision Entries ---
    const recentVisionEntries = await Vision.find({ time: { $gte: twoMinutesAgo } });
    console.log(`Found ${recentVisionEntries.length} recent Vision entries.`);

    for (const vision of recentVisionEntries) {
      console.log(`Checking vision entry at centre: ${vision.centreId}`);

      const customerEntry = await Customer.findOne({
        centreId: vision.centreId,
        inTime: {
          $gte: moment(vision.time).subtract(2, 'minutes').toDate(),
          $lte: moment(vision.time).add(2, 'minutes').toDate(),
        },
      });

      if (!customerEntry) {
        console.log(`❌ Customer entry missing for Vision input at centre ${vision.centreId}`);

        // Send SSE to all connected clients immediately
        sendSSEToAll({
          type: 'MissedEntry',
          message: `Customer entry missing for Vision input at centre ${vision.centreId}`,
          centreId: vision.centreId,
          visionId: vision._id,
        });

        console.log(`Sent SSE for missed customer entry at centre ${vision.centreId}`);
      }
    }

    console.log(`Missed entries check completed.`);
  } catch (error) {
    console.error('Error in checkMissedEntries:', error);
  }
};

module.exports = { checkMissedEntries, registerSSEClient };