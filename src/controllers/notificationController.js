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

    const recentVisionEntries = await Vision.find({
      createdAt: { $gte: moment().subtract(1, 'hour').toDate() }
    });

    const recentCustomers = await Customer.find({ createdAt: { $gte: tenMinutesAgo } });
    console.log(`Found ${recentCustomers.length} recent customers.`);

    for (const customer of recentCustomers) {
      if (processedCustomerIds.has(customer._id.toString())) continue;

      console.log(`[CM CHECK] Looking for Vision near ${customer.name}'s inTime (${customer.inTime}) at Centre: ${customer.centreId}`);

      // Convert inTime to Date if it's a string, and Vision time also needs to be converted to Date
      const customerInTime = new Date(customer.inTime); // customer.inTime is a Date object already
      const matchedVision = recentVisionEntries.find(vision => {
        const visionTime = new Date(vision.time);  // Convert the ISO string (vision.time) to Date
        
        console.log(`[CM CHECK] Comparing times: Customer InTime: ${customerInTime}, Vision Time: ${visionTime}`);
        console.log(`[CM CHECK] Checking if centreId matches: ${vision.centreId?.toString()} === ${customer.centreId?.toString()}`);

        return (
          vision.centreId?.toString() === customer.centreId?.toString() &&
          visionTime >= moment(customerInTime).subtract(10, 'minutes').toDate() &&
          visionTime <= moment(customerInTime).add(10, 'minutes').toDate()
        );
      });

      if (!matchedVision) {
        const centre = await Centre.findById(customer.centreId);
        const centreId = centre ? centre.centreId : 'Unknown Centre';

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

    console.log(`✅ Missed entries check completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('❌ Error in checkMissedEntries:', error);
  }
};



module.exports = { checkMissedEntries, registerSSEClient };