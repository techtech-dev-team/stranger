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
  // Allow the frontend domain to access the SSE stream
  res.setHeader("Access-Control-Allow-Origin", "https://test.st9.in"); // Your frontend domain
  res.setHeader("Access-Control-Allow-Credentials", "true");  // Allow credentials (cookies, etc.)

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Immediately send headers

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ message: "SSE connected" });

  const keepAlive = setInterval(() => {
    res.write(`: ping\n\n`); // Ensure the connection stays alive
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAlive);
    res.end();
  });
});


module.exports = router;
