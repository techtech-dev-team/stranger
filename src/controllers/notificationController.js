const Customer = require('../models/Customer');
const Vision = require('../models/Vision');
const MissedEntry = require('../models/MissedEntry');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const moment = require('moment-timezone');

const sseClients = []; // To store SSE clients for live notifications

// const checkMissedEntries = async () => {
//   try {
//     const fifteenMinutesAgo = moment().subtract(1, 'minutes').toDate(); // Adjusted to 15 mins as per requirement

//     // **1. Check if Customer entry is missing**
//     const unverifiedCustomers = await Customer.find({ createdAt: { $gte: fifteenMinutesAgo } });

//     for (const customer of unverifiedCustomers) {
//       const visionEntry = await Vision.findOne({
//         time: {
//           $gte: moment(customer.inTime).subtract(1, 'minutes').toISOString(),
//           $lte: moment(customer.inTime).add(1, 'minutes').toISOString(),
//         },
//         nameOrCode: customer.number,
//       });

//       const missedEntry = await MissedEntry.findOne({ customerId: customer._id, visionId: visionEntry?._id });

//       if (!visionEntry && !missedEntry) {
//         // Vision Missed (Customer entry exists but no Vision entry)
//         const visionManager = await User.findOne({ role: 'Vision', centreIds: customer.centreId });

//         if (visionManager) {
//           const message = `Missed Vision Entry for Customer: ${customer.name}`;
//           sendNotification(visionManager._id, message);
//           sendSSE({ type: 'MissedEntry', message }); // Send live notification
//         }

//         await MissedEntry.create({ customerId: customer._id, type: 'Vision Missed' });
//       }

//       if (visionEntry && !missedEntry) {
//         // Centre Missed (Vision entry exists but no Customer entry)
//         const centreManager = await User.findOne({ role: 'CM', centreIds: customer.centreId });

//         if (centreManager) {
//           const message = `Missed Centre Entry for Vision: ${visionEntry.nameOrCode}`;
//           sendNotification(centreManager._id, message);
//           sendSSE({ type: 'MissedEntry', message }); // Send live notification
//         }

//         await MissedEntry.create({ customerId: customer._id, visionId: visionEntry._id, type: 'Centre Missed' });
//       }
//     }

//     // **2. Check if Vision entry exists but Customer entry is missing**
//     const recentVisionEntries = await Vision.find({ time: { $gte: fifteenMinutesAgo } });

//     for (const visionEntry of recentVisionEntries) {
//       const customerEntry = await Customer.findOne({ number: visionEntry.nameOrCode, inTime: visionEntry.time });

//       if (!customerEntry) {
//         // If no matching customer entry found, log it as a "Customer Missed"
//         const centreManager = await User.findOne({ role: 'CM', centreIds: visionEntry.centreId });

//         if (centreManager) {
//           const message = `Missed Customer Entry for Vision: ${visionEntry.nameOrCode}`;
//           sendNotification(centreManager._id, message);
//           sendSSE({ type: 'MissedEntry', message });
//         }

//         await MissedEntry.create({ visionId: visionEntry._id, type: 'Customer Missed' });
//       }
//     }

//     console.log({ message: 'Missed entries checked' });
//   } catch (error) {
//     console.error('Error:', error);
//   }
// };


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
