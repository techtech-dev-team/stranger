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

// Missed entry check function
// 🧠 Global (in-memory) dedupe sets – persists across multiple interval calls
const notifiedCustomerIds = new Set();
const notifiedVisionIds = new Set();

const checkMissedEntries = async () => {
  try {
    const tenMinutesAgo = moment().subtract(10, 'minutes').toDate();
    const processedCustomerIds = new Set();
    const processedVisionIds = new Set();

    console.log(`[MissedCheck] Starting missed entry check at ${new Date().toISOString()}`);

    // --- 1. CM Check ---
    const recentCustomers = await Customer.find({ createdAt: { $gte: tenMinutesAgo } });
    console.log(`[CM Check] Found ${recentCustomers.length} recent customer entries.`);

    for (const customer of recentCustomers) {
      const customerIdStr = customer._id.toString();

      if (processedCustomerIds.has(customerIdStr) || notifiedCustomerIds.has(customerIdStr)) continue;

      console.log(`[CM Check] Checking customer: ${customer.name}, inTime: ${customer.inTime}, centreId: ${customer.centreId}`);

      const from = moment(customer.inTime).subtract(10, 'minutes').toDate();
      const to = moment(customer.inTime).add(10, 'minutes').toDate();

      const visionEntry = await Vision.findOne({
        centreId: customer.centreId,
        time: { $gte: from, $lte: to },
      });

      if (!visionEntry) {
        console.warn(`[CM Check] ❌ No Vision entry found for customer: ${customer.name} at centre ${customer.centreId}`);

        const centre = await Centre.findById(customer.centreId);

        sendSSEToAll({
          type: 'MissedEntry',
          message: `Vision entry missing for ${customer.name}`,
          customerId: customer._id,
          customerName: customer.name,
          centreId: centre ? centre.centreId : 'Unknown Centre',
        });

        notifiedCustomerIds.add(customerIdStr); // 🔐 Add to global dedupe
        processedCustomerIds.add(customerIdStr);
      } else {
        console.log(`[CM Check] ✅ Vision entry found for customer: ${customer.name}`);
      }
    }

    // --- 2. Vision Check ---
    const recentVisionEntries = await Vision.find({ time: { $gte: tenMinutesAgo } });
    console.log(`[Vision Check] Found ${recentVisionEntries.length} recent vision entries.`);

    for (const vision of recentVisionEntries) {
      const visionIdStr = vision._id.toString();

      if (processedVisionIds.has(visionIdStr) || notifiedVisionIds.has(visionIdStr)) continue;

      console.log(`[Vision Check] Checking vision entry: ${vision._id}, time: ${vision.time}, centreId: ${vision.centreId}`);

      const from = moment(vision.time).subtract(10, 'minutes').toDate();
      const to = moment(vision.time).add(10, 'minutes').toDate();

      const customerEntry = await Customer.findOne({
        centreId: vision.centreId,
        inTime: { $gte: from, $lte: to },
      });

      if (!customerEntry) {
        console.warn(`[Vision Check] ❌ No Customer entry found for Vision input at centre ${vision.centreId}`);

        sendSSEToAll({
          type: 'MissedEntry',
          message: `Customer entry missing for Vision input at centre ${vision.centreId}`,
          centreId: vision.centreId,
          visionId: vision._id,
        });

        notifiedVisionIds.add(visionIdStr); // 🔐 Add to global dedupe
        processedVisionIds.add(visionIdStr);
      } else {
        console.log(`[Vision Check] ✅ Customer entry found for Vision input at centre ${vision.centreId}`);
      }
    }

    console.log(`[MissedCheck] Completed missed entry check.`);
  } catch (error) {
    console.error('[MissedCheck] Error:', error);
  }
};


module.exports = { checkMissedEntries, registerSSEClient };