const { MongoClient } = require("mongodb");

// Replace with your actual MongoDB connection string
const uri = "mongodb+srv://corvaya316:khushi9786@cluster0.yubab.mongodb.net/stranger";

async function watchChanges() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB... Watching for changes");

    const db = client.db("stranger");
    const collection = db.collection("your_collection_name"); // Replace with actual collection

    const changeStream = collection.watch();

    changeStream.on("change", (change) => {
      console.log("Change detected:", JSON.stringify(change, null, 2));
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

watchChanges();
