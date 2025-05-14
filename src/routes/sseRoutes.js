const express = require("express");
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Ensure it's imported

router.get("/auth", (req, res) => {
    res.json({ message: "Authenticated" });
});

router.get("/events", (req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // 🚨 this forces headers to be sent immediately

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Initial connection event
    sendEvent({ message: "SSE connected" });

    // Keep-alive comment line to prevent connection drop
    const keepAlive = setInterval(() => {
        res.write(`: keep-alive\n\n`);
    }, 15000); // ping every 15 seconds

    // Your actual event pushing
    const dataPush = setInterval(() => {
        sendEvent({ timestamp: new Date().toISOString(), message: "Live update!" });
    }, 180000);

    req.on("close", () => {
        clearInterval(dataPush);
        clearInterval(keepAlive);
        res.end();
    });
});


module.exports = router;
