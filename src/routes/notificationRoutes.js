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
  console.log('New SSE client connection received');

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader('Content-Encoding', 'identity'); // Disable compression to avoid chunking issues

  res.flushHeaders(); // Immediately flush headers

  const sendEvent = (data) => {
    console.log('Sending event:', data); // Debugging log
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial connection message
  sendEvent({ message: "SSE connected" });

  // Send data periodically to keep the connection alive
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");  // Empty comment to keep connection alive
  }, 15000);

  // Simulate live updates
  const sendLiveUpdates = setInterval(() => {
    const message = { timestamp: new Date().toISOString(), message: "Live update!" };
    console.log('Sending live update:', message);  // Debugging log
    sendEvent(message);
  }, 5000);

  // Handle client disconnection
  req.on("close", () => {
    console.log('SSE client disconnected');
    clearInterval(keepAlive);
    clearInterval(sendLiveUpdates);
    res.end();
  });
});

module.exports = router;
