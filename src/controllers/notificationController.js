const Customer = require('../models/Customer');
const Vision = require('../models/Vision');
const MissedEntry = require('../models/MissedEntry');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const moment = require('moment-timezone');

const checkMissedEntries = async (req, res) => {
  try {
    const fifteenMinutesAgo = moment().subtract(15, 'minutes').toDate();
    const unverifiedCustomers = await Customer.find({
      createdAt: { $gte: fifteenMinutesAgo },
    });

    for (const customer of unverifiedCustomers) {
      const visionEntry = await Vision.findOne({
        time: { $gte: moment(customer.inTime).subtract(15, 'minutes').toISOString(), $lte: moment(customer.inTime).add(15, 'minutes').toISOString() },
        nameOrCode: customer.number,
      });

      const missedEntry = await MissedEntry.findOne({ customerId: customer._id });

      if (!visionEntry && !missedEntry) {
        const visionManager = await User.findOne({ role: 'Vision Manager', centreId: customer.centreId });
        if (visionManager) sendNotification(visionManager._id, `Missed Vision Entry for Customer: ${customer.name}`);
        await MissedEntry.create({ customerId: customer._id, type: 'Vision Missed' });
      } else if (visionEntry && !missedEntry) {
        const centreManager = await User.findOne({ role: 'Centre Manager', centreId: customer.centreId });
        if (centreManager) sendNotification(centreManager._id, `Missed Centre Entry for Vision: ${visionEntry.nameOrCode}`);
        await MissedEntry.create({ customerId: customer._id, visionId: visionEntry._id, type: 'Centre Missed' });
      }
    }

    console.log({ message: 'Missed entries checked' });
  } catch (error) {
    console.error('Error:', error);
    console.log(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { checkMissedEntries };
