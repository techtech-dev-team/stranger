const express = require('express');
const router = express.Router();
const { checkMissedEntries, sseHandler } = require('../controllers/notificationController');

// POST - Trigger Missed Entry Check
router.post('/check-missed-entries', async (req, res) => {
  try {
    await checkMissedEntries();
    res.status(200).json({ message: 'Missed entry check completed.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to check missed entries.' });
  }
});

// GET - Live Notifications using SSE
router.get('/notifications', sseHandler);

router.get('/check', async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oneMinutesAgo = moment().subtract(1, 'minutes').toDate();
    const messages = [];

    if (user.role === 'Vision') {
      const visionEntries = await Vision.find({
        time: { $gte: oneMinutesAgo },
        centreId: { $in: user.centreIds }
      });

      for (const v of visionEntries) {
        const customer = await Customer.findOne({
          number: v.nameOrCode,
          inTime: {
            $gte: moment(v.time).subtract(1, 'minutes').toDate(),
            $lte: moment(v.time).add(1, 'minutes').toDate(),
          }
        });

        const alreadyMissed = await MissedEntry.findOne({ visionId: v._id });

        if (!customer && !alreadyMissed) {
          const cmUser = await User.findOne({ role: 'CM', centreIds: v.centreId });
          if (cmUser) {
            const msg = `Missed Customer Entry for Vision: ${v.nameOrCode}`;
            messages.push(msg);
            sendNotification(cmUser._id, msg); // 📢 Notify CM
            sendSSE({ type: 'MissedEntry', message: msg });
            await MissedEntry.create({ visionId: v._id, type: 'Customer Missed' });
          }
        }
      }
    }

    if (user.role === 'CM') {
      const customerEntries = await Customer.find({
        createdAt: { $gte: oneMinutesAgo },
        centreId: { $in: user.centreIds }
      });

      for (const c of customerEntries) {
        const vision = await Vision.findOne({
          nameOrCode: c.number,
          time: {
            $gte: moment(c.inTime).subtract(1, 'minutes').toISOString(),
            $lte: moment(c.inTime).add(1, 'minutes').toISOString()
          }
        });

        const alreadyMissed = await MissedEntry.findOne({ customerId: c._id });

        if (!vision && !alreadyMissed) {
          const visionUser = await User.findOne({ role: 'Vision', centreIds: c.centreId });
          if (visionUser) {
            const msg = `Missed Vision Entry for Customer: ${c.name}`;
            messages.push(msg);
            sendNotification(visionUser._id, msg); // 📢 Notify Vision
            sendSSE({ type: 'MissedEntry', message: msg });
            await MissedEntry.create({ customerId: c._id, type: 'Vision Missed' });
          }
        }
      }
    }

    return res.status(200).json({ messages });

  } catch (err) {
    console.error('Error checking missed entries:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
