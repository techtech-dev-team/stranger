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
  
  // Set headers for SSE and CORS
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Content-Encoding", "identity"); // Disable compression
  res.setHeader('Access-Control-Allow-Origin', '*');  // Allow all origins for CORS
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    
    // Remove the client from the sseClients array
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

      const alreadyLogged = await MissedEntry.findOne({ customerId: customer._id });

      if (!visionEntry && !alreadyLogged) {
        console.log(`❌ Vision entry missing for ${customer.name}`);
        
        const visionManager = await User.findOne({ role: 'Vision', centreIds: customer.centreId });
        if (visionManager) {
          const message = `Vision entry missing for ${customer.name}`;

          sendNotification(visionManager._id, message);

          // Send to all connected clients with full details
          sendSSEToAll({
            type: 'MissedEntry',
            message: `Vision entry missing for ${customer.name}`,
            customerId: customer._id,
            customerName: customer.name,
            centreId: customer.centreId,
          });
        }

        await MissedEntry.create({
          customerId: customer._id,
          type: 'Vision Missed',
        });
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

      const alreadyLogged = await MissedEntry.findOne({ visionId: vision._id });

      if (!customerEntry && !alreadyLogged) {
        console.log(`❌ Customer entry missing for Vision input at centre ${vision.centreId}`);

        const cmManager = await User.findOne({
          role: 'CM',
          centreIds: { $in: [vision.centreId] },
        });

        if (cmManager) {
          const message = `Missed Customer Entry for Centre: ${vision.centreId}`;
          sendNotification(cmManager._id, message);
          sendSSEToAll({ type: 'MissedEntry', message });
        }

        await MissedEntry.create({
          visionId: vision._id,
          type: 'Customer Missed',
        });
      }
    }

    console.log(`Missed entries check completed.`);
  } catch (error) {
    console.error('Error in checkMissedEntries:', error);
  }
};



module.exports = { checkMissedEntries, sseHandler };
