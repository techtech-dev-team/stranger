const express = require("express");
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Ensure it's imported

router.get("/auth", (req, res) => {
    res.json({ message: "Authenticated" });
});

router.get("/events", (req, res) => {  // ✅ Protect this route
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent({ message: "Connected to SSE" });

    const intervalId = setInterval(() => {
        sendEvent({ timestamp: new Date().toISOString(), message: "Live update!" });
    }, 5000);

    req.on("close", () => {
        clearInterval(intervalId);
        res.end();
    });
});

module.exports = router;
