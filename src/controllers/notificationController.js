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

const checkMissedEntries = async () => {
  try {
    console.log('Checking missed entries...');
    const tenMinutesAgo = moment().subtract(10, 'minutes').toDate();
    const processedCustomerIds = new Set();
    const processedVisionIds = new Set();

    // Get all Vision entries created recently (you can adjust this time window)
    const recentVisionEntries = await Vision.find({
      createdAt: { $gte: moment().subtract(1, 'hour').toDate() }
    });

    // --- 1. Check Customer entries ---
    const recentCustomers = await Customer.find({ createdAt: { $gte: tenMinutesAgo } });
    console.log(`Found ${recentCustomers.length} recent customers.`);

    // Commenting out the customer-related logic
    for (const customer of recentCustomers) {
      if (processedCustomerIds.has(customer._id.toString())) continue;

      console.log(`[CM CHECK] Looking for Vision near ${customer.name}'s inTime (${customer.inTime}) at Centre: ${customer.centreId}`);

      // Match vision manually (since vision.time is string)
      const matchedVision = recentVisionEntries.find(vision => {
        const visionTime = new Date(vision.time);
        return (
          vision.centreId?.toString() === customer.centreId?.toString() &&
          visionTime >= moment(customer.inTime).subtract(10, 'minutes').toDate() &&
          visionTime <= moment(customer.inTime).add(10, 'minutes').toDate()
        );
      });

      // Show the message about no vision entry for the customer
      if (!matchedVision) {
        const centre = await Centre.findById(customer.centreId);
        const centreId = centre ? centre.centreId : 'Unknown Centre';

        // Log and send a message about the missed Vision entry for the customer
        console.log(`[⚠️ Missed Vision] No vision found for customer ${customer.name} (ID: ${customer._id}) at Centre ${centreId}`);

        sendSSEToAll({
          type: 'MissedEntry',
          message: `No Vision entry found for customer ${customer.name}`,
          customerId: customer._id,
          customerName: customer.name,
          centreId: centreId,
        });

        processedCustomerIds.add(customer._id.toString());
      }
    }

    // --- 2. Check Vision entries ---
    console.log(`Found ${recentVisionEntries.length} recent Vision entries.`);

    for (const vision of recentVisionEntries) {
      if (processedVisionIds.has(vision._id.toString())) continue;

      const visionTime = new Date(vision.time);

      // Commenting out the matching customer logic for Vision entries
      // const matchingCustomer = await Customer.findOne({
      //   centreId: vision.centreId,
      //   inTime: {
      //     $gte: moment(visionTime).subtract(10, 'minutes').toDate(),
      //     $lte: moment(visionTime).add(10, 'minutes').toDate(),
      //   },
      // });

      // Commenting out the logic for missed CM notification
      // const centre = await Centre.findById(vision.centreId);
      // const centreId = centre ? centre.centreId : 'Unknown Centre';
      // console.log(`[⚠️ Missed CM] No CM found for Vision entry (ID: ${vision._id}) at ${visionTime} - Centre: ${centreId}`);

      // // Send Vision-related missed entry notification
      // sendSSEToAll({
      //   type: 'MissedEntry',
      //   message: `Customer entry missing for Vision input at centre ${centreId}`,
      //   centreId: centreId,
      //   visionId: vision._id,
      // });

      processedVisionIds.add(vision._id.toString());
    }

    console.log(`✅ Missed entries check completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('❌ Error in checkMissedEntries:', error);
  }
};








module.exports = { checkMissedEntries, registerSSEClient };