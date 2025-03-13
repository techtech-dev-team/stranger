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

const { protect } = require("./middleware/authMiddleware"); // Import auth middleware

dotenv.config();
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: "*", // Allows requests from any origin
    credentials: true, // Allows cookies, authorization headers, etc.
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
}));
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

module.exports = app;
