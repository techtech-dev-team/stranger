const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");

// Import Routes
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const visionRoutes = require("./routes/visionRoutes");
const visionIdRoutes = require("./routes/VisionIdRoutes");
const regionRoutes = require("./routes/regionRoutes");
const branchRoutes = require("./routes/branchRoutes");
const centreRoutes = require("./routes/centreRoutes");
const cashCollectionRoutes = require("./routes/cashCollectionRoutes");
const gameRoutes = require("./routes/gameRoutes");
const userRoutes = require("./routes/userRoutes"); // ✅ Added user routes
const regionBranchCentre = require("./routes/regionBranchCentreRoutes"); // ✅ Added regionBranchCentre routes
const notificationRoutes = require('./routes/notificationRoutes');
const salesRoutes = require("./routes/salesRoutes");
const graphRoutes = require('./routes/graphRoutes');
const tidRoutes = require("./routes/tidRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const sseRoutes = require("./routes/sseRoutes");
const { refreshData } = require("./controllers/refreshController");
const { checkMissedEntries } = require('./controllers/notificationController');
const helmet = require("helmet");


setInterval(checkMissedEntries, 60 * 1000);
console.log('Missed entry checker started...');


const { protect } = require("./middleware/authMiddleware"); // Import auth middleware

dotenv.config();
const app = express();

connectDB();
let clients = [];

app.get('/api/live-users', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// Mock function to generate random user data
function getLiveUsersByRole() {
  const roles = ["CM", "ARM", "Vision", "ID", "BSS", "OT", "CT", "FM"];
  const data = {};
  roles.forEach(role => {
    data[role] = Math.floor(Math.random() * 10); // Random count between 0-9
  });
  return data;
}

// Send updates to all connected clients every 3 seconds
setInterval(() => {
  const data = getLiveUsersByRole();
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
}, 3000);


app.use(cors({
    origin: function (origin, callback) {
        callback(null, origin || "*"); // Allow requests from all origins
    },
    credentials: true, // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(cookieParser()); // Add this in your `server.js`
app.options("*", cors());

app.use(express.json()); // Middleware to parse JSON data
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "'unsafe-eval'", 
            "https://www.gstatic.com", 
            "https://www.google.com"
          ],
          frameSrc: ["'self'", "https://www.google.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://www.google.com"],
        },
      },
    })
  );

  app.get("/api/sse", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
  
      const sendData = () => {
          res.write(`data: ${JSON.stringify({ message: "New Data Added" })}\n\n`);
      };
  
      // Send an update every 5 seconds (for testing)
      const interval = setInterval(sendData, 5000);
  
      req.on("close", () => {
          clearInterval(interval);
          res.end();
      });
  });
   
app.use("/api/sse", sseRoutes);
app.use("/api/users", userRoutes);
app.use("/game", gameRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/visionid", visionIdRoutes);
app.use("/api/tids", tidRoutes);
app.use("/api", transactionRoutes);
// Routes (Protected)
app.use(protect);
// Refresh data before any API route is hit
app.use("/api/admin", adminRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/centres", centreRoutes);
app.use("/api/cash-collection", cashCollectionRoutes);
app.use("/api/regions-branches-centres", regionBranchCentre); // ✅ Added regionBranchCentre routes
app.use('/api/notifications', notificationRoutes);
app.use("/api/sales", salesRoutes); // Base route for sales-related APIs
app.use('/api/graph', graphRoutes);


module.exports = app;
