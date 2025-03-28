const express = require("express");
const { MongoClient } = require("mongodb");

const router = express.Router();

// MongoDB Connection URI
const uri = process.env.MONGO_URI || "mongodb+srv://corvaya316:khushi9786@cluster0.yubab.mongodb.net/stranger";
const client = new MongoClient(uri);

let changeStream;

// Store active SSE clients
const clients = [];

async function watchDatabase() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB... Listening for changes");

    const db = client.db("stranger");
    const collection = db.collection("customers"); // Replace with actual collection

    changeStream = collection.watch();

    changeStream.on("change", (change) => {
      console.log("🔄 Change detected:", change);

      // Send data to all connected SSE clients
      clients.forEach((client) =>
        client.write(`data: ${JSON.stringify(change)}\n\n`)
      );
    });

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// SSE Endpoint
router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);
  console.log(`📡 New SSE client connected (${clients.length} total)`);

  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
    console.log(`❌ Client disconnected (${clients.length} total)`);
  });
});

// Start watching the database
watchDatabase();

module.exports = router;
