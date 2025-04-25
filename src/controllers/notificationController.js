const Customer = require('../models/Customer');
const Vision = require('../models/Vision');
const MissedEntry = require('../models/MissedEntry');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const moment = require('moment-timezone');

const sseClients = []; // To store SSE clients for live notifications

// Function to send SSE (Server-Sent Events)
const sendSSE = (data, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader('Access-Control-Allow-Origin', '*');  // Allow all or dynamic origins
  res.setHeader('Content-Encoding', 'identity'); // Disable compression
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// SSE Endpoint to subscribe to live notifications
const sseHandler = (req, res) => {
  console.log('SSE client connected');
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader('Content-Encoding', 'identity'); // Disable compression to avoid chunking issues

  res.flushHeaders();  // Immediately flush headers

  // Push the client to the list
  sseClients.push({ res });
  console.log('Number of clients:', sseClients.length);  // Debugging log

  // Periodic message to keep connection alive
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);  // Send a comment every 15 seconds to keep the connection alive

  // Handling real-time updates
  const sendLiveUpdates = setInterval(() => {
    const message = { timestamp: new Date().toISOString(), message: "Live update!" };
    console.log('Sending live update:', message);  // Debugging log
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  }, 5000);  // Send every 5 seconds

  // Handle client disconnect
  req.on("close", () => {
    console.log('SSE client disconnected');
    clearInterval(keepAlive);
    clearInterval(sendLiveUpdates);
    const idx = sseClients.findIndex(client => client.res === res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
    console.log('Remaining clients:', sseClients.length); // Debugging log
    res.end();
  });
};

const checkMissedEntries = async () => {
  try {
    const twoMinutesAgo = moment().subtract(2, 'minutes').toDate();
    console.log(`\nChecking missed entries since: ${twoMinutesAgo}`);

    // --- 1. Customer Entries: Check for missing Vision entry ---
    const recentCustomers = await Customer.find({ createdAt: { $gte: twoMinutesAgo } });
    console.log(`Found ${recentCustomers.length} recent customer entries.`);

    for (const customer of recentCustomers) {
      console.log(`\nChecking customer: ${customer.name} (${customer.number || 'No number'}) at centre: ${customer.centreId}`);

      const visionEntry = await Vision.findOne({
        centreId: customer.centreId,
        time: {
          $gte: moment(customer.inTime).subtract(2, 'minutes').toISOString(),
          $lte: moment(customer.inTime).add(2, 'minutes').toISOString(),
        },
      });

      const alreadyLogged = await MissedEntry.findOne({ customerId: customer._id });

      if (!visionEntry && !alreadyLogged) {
        console.log(`❌ Vision entry missing for ${customer.name} at centre ${customer.centreId}`);

        const visionManager = await User.findOne({ role: 'Vision', centreIds: customer.centreId });

        if (visionManager) {
          const message = `Missed Vision Entry for Centre: ${customer.centreId}`;
          sendNotification(visionManager._id, message);
          sendSSE({ type: 'MissedEntry', message });
        }

        await MissedEntry.create({
          customerId: customer._id,
          type: 'Vision Missed',
        });
      } else {
        console.log(`✅ Vision entry found or already handled.`);
      }
    }

    // --- 2. Vision Entries: Check for missing Customer entry ---
    const recentVisionEntries = await Vision.find({ time: { $gte: twoMinutesAgo } });
    console.log(`\nFound ${recentVisionEntries.length} recent Vision entries.`);

    for (const vision of recentVisionEntries) {
      console.log(`\nChecking vision entry at centre: ${vision.centreId} (name/code: ${vision.nameOrCode})`);

      const customerEntry = await Customer.findOne({
        centreId: vision.centreId,
        inTime: {
          $gte: moment(vision.time).subtract(2, 'minutes').toDate(),
          $lte: moment(vision.time).add(2, 'minutes').toDate(),
        },
      });

      const alreadyLogged = await MissedEntry.findOne({ visionId: vision._id });

      if (!customerEntry && !alreadyLogged) {
        console.log(`❌ Customer entry missing for Vision input at centre ${vision.centreId}`);

        const cmManager = await User.findOne({
          role: 'CM',
          centreIds: { $in: [vision.centreId] }, // ✅ Use $in for array matching
        });

        if (cmManager) {
          const message = `Missed Customer Entry for Centre: ${vision.centreId}`;
          sendNotification(cmManager._id, message);
          sendSSE({ type: 'MissedEntry', message });
        }

        await MissedEntry.create({
          visionId: vision._id,
          type: 'Customer Missed',
        });
      } else {
        console.log(`✅ Customer entry found or already handled.`);
      }
    }

    console.log(`\n✅ Missed entries check completed.\n`);
  } catch (error) {
    console.error('Error in checkMissedEntries:', error);
  }
};

module.exports = { checkMissedEntries, sseHandler };
