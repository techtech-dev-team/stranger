const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

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

const { checkMissedEntries } = require('./controllers/notificationController');

// Run every minute to check missed entries and log them
setInterval(checkMissedEntries, 60 * 1000);
console.log('Missed entry checker started...');


const { protect } = require("./middleware/authMiddleware"); // Import auth middleware

dotenv.config();
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        callback(null, origin || "*"); // Allow requests from all origins
    },
    credentials: true, // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());

app.use(express.json()); // Middleware to parse JSON data
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

app.use("/api/users", userRoutes);
app.use("/game", gameRoutes);

// Routes (Protected)
app.use(protect);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/visionid", visionIdRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/centres", centreRoutes);
app.use("/api/cash-collection", cashCollectionRoutes);
app.use("/api/regions-branches-centres", regionBranchCentre); // ✅ Added regionBranchCentre routes
app.use('/api/notifications', notificationRoutes);



module.exports = app;
