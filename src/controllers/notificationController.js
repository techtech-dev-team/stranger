const Customer = require('../models/Customer');
const Vision = require('../models/Vision');
const Centre = require('../models/Centre');
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

const alreadyNotified = {
  customers: new Set(),
  visions: new Set()
};

const checkMissedEntries = async () => {
  try {
    const tenMinutesAgo = moment().subtract(10, 'minutes').toDate();
    const now = new Date();

    const recentCustomers = await Customer.find({ createdAt: { $gte: tenMinutesAgo } });
    const recentVisions = await Vision.find({ time: { $gte: tenMinutesAgo } });

    console.log(`Checking missed entries...`);
    console.log(`Found ${recentCustomers.length} recent customers.`);
    console.log(`Found ${recentVisions.length} recent vision entries.`);

    // --- 1. Customer entries -> Check for missing vision
    for (const customer of recentCustomers) {
      const customerId = customer._id.toString();
      if (alreadyNotified.customers.has(customerId)) continue;

      const from = moment(customer.inTime).subtract(10, 'minutes').toDate();
      const to = moment(customer.inTime).add(10, 'minutes').toDate();

      console.log(`[CM CHECK] Looking for Vision near ${customer.name}'s inTime (${customer.inTime}) at Centre: ${customer.centreId}`);

      const match = await Vision.findOne({
        centreId: customer.centreId,
        time: { $gte: from, $lte: to }
      });

      if (!match) {
        const centre = await Centre.findById(customer.centreId);

        console.log(`[⚠️ Missed Vision] No vision found for customer ${customer.name} (ID: ${customerId}) at Centre ${centre?.centreId || 'Unknown'}`);

        sendSSEToAll({
          type: 'MissedEntry',
          message: `Vision entry missing for ${customer.name}`,
          customerId: customerId,
          customerName: customer.name,
          centreId: centre?.centreId || 'Unknown Centre',
        });

        alreadyNotified.customers.add(customerId);
      }
    }

    // --- 2. Vision entries -> Check for missing customer
    for (const vision of recentVisions) {
      const visionId = vision._id.toString();
      if (alreadyNotified.visions.has(visionId)) continue;

      const from = moment(vision.time).subtract(10, 'minutes').toDate();
      const to = moment(vision.time).add(10, 'minutes').toDate();

      console.log(`[VISION CHECK] Looking for Customer near Vision (${vision.time}) at Centre: ${vision.centreId}`);

      const match = await Customer.findOne({
        centreId: vision.centreId,
        inTime: { $gte: from, $lte: to }
      });

      if (!match) {
        console.log(`[⚠️ Missed CM] No customer entry found for vision input (ID: ${visionId}) at Centre ${vision.centreId}`);

        sendSSEToAll({
          type: 'MissedEntry',
          message: `Customer entry missing for Vision input at centre ${vision.centreId}`,
          centreId: vision.centreId,
          visionId: visionId,
        });

        alreadyNotified.visions.add(visionId);
      }
    }

    console.log(`✅ Missed entries check completed at ${new Date().toISOString()}`);

  } catch (error) {
    console.error('💥 Error in checkMissedEntries:', error);
  }
};


module.exports = { checkMissedEntries, registerSSEClient };