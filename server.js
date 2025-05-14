require("dotenv").config(); // Load environment variables
require('./src/cron/dayBalanceJob');
require('./src/cron/dailySummaryCron');
const http = require("http");
const app = require("./src/app"); // Import the app from src/app.js

const PORT = process.env.PORT || 5000;

// Create an HTTP server and listen on the specified port
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
