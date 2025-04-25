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



module.exports = router;
