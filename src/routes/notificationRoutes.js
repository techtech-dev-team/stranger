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
router.get("/notifications", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // immediately flush headers

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ message: "SSE connected" });

  const keepAlive = setInterval(() => {
    res.write(`: ping\n\n`);  // Keep connection alive
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAlive);
    res.end();
  });
});


module.exports = router;
