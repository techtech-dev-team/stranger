const express = require('express');
const router = express.Router();
const { checkMissedEntries } = require('../controllers/notificationController');

// POST - Trigger Missed Entry Check
router.post('/check-missed-entries', async (req, res) => {
  try {
    await checkMissedEntries();
    res.status(200).json({ message: 'Missed entry check completed. Check the console for notifications.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to check missed entries.' });
  }
});

module.exports = router;
