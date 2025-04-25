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
const checkMissedEntries = async () => {
  try {
    const tenMinutesAgo = moment().subtract(10, 'minutes').toDate();
    const processedCustomerIds = new Set(); // To track processed customer IDs
    const processedVisionIds = new Set(); // To track processed vision IDs
  
    // --- 1. Customer Entries ---
    const recentCustomers = await Customer.find({ createdAt: { $gte: tenMinutesAgo } });
   
    for (const customer of recentCustomers) {
      if (processedCustomerIds.has(customer._id.toString())) {
        continue; // Skip if already processed
      }
      
      const visionEntry = await Vision.findOne({
        centreId: customer.centreId,
        time: {
          $gte: moment(customer.inTime).subtract(10, 'minutes').toISOString(),
          $lte: moment(customer.inTime).add(10, 'minutes').toISOString(),
        },
      });

      if (!visionEntry) {
     
    
        // Fetch the actual centreId from the Centre model
        const centre = await Centre.findById(customer.centreId);
    
        // Send SSE to all connected clients immediately
        sendSSEToAll({
          type: 'MissedEntry',
          message: `Vision entry missing for ${customer.name}`,
          customerId: customer._id,
          customerName: customer.name,
          centreId: centre ? centre.centreId : 'Unknown Centre', // Use the actual centreId or fallback
        });
        processedCustomerIds.add(customer._id.toString()); // Mark as processed
    
      }
    }

    // --- 2. Vision Entries ---
    const recentVisionEntries = await Vision.find({ time: { $gte: tenMinutesAgo } });
    console.log(`Found ${recentVisionEntries.length} recent Vision entries.`);

    for (const vision of recentVisionEntries) {
      if (processedVisionIds.has(vision._id.toString())) {
        continue; // Skip if already processed
      }

      const customerEntry = await Customer.findOne({
        centreId: vision.centreId,
        inTime: {
          $gte: moment(vision.time).subtract(10, 'minutes').toDate(),
          $lte: moment(vision.time).add(10, 'minutes').toDate(),
        },
      });

      if (!customerEntry) {
        

        // Send SSE to all connected clients immediately
        sendSSEToAll({
          type: 'MissedEntry',
          message: `Customer entry missing for Vision input at centre ${vision.centreId}`,
          centreId: vision.centreId,
          visionId: vision._id,
        });
        processedVisionIds.add(vision._id.toString()); // Mark as processed

      }
    }

    console.log(`Missed entries check completed.`);
  } catch (error) {
    console.error('Error in checkMissedEntries:', error);
  }
};

module.exports = { checkMissedEntries, registerSSEClient };