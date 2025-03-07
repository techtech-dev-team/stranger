const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- Import admin routes
const customerRoutes = require('./routes/customerRoutes'); // Import customer routes
const staffRoutes = require('./routes/staffRoutes'); // Import staff routes
const serviceRoutes = require('./routes/serviceRoutes'); // Import service routes
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const visionRoutes = require('./routes/visionRoutes'); // Import Vision routes
const { protect } = require('./middleware/authMiddleware'); // Import auth middleware
const visionIdRoutes = require('./routes/VisionIdRoutes');
const regionRoutes = require("./routes/regionRoutes");
const branchRoutes = require("./routes/branchRoutes");
const centreRoutes = require("./routes/centreRoutes");




require('dotenv').config();
const app = express();
// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Routes
app.use('/api/auth', authRoutes); // No auth required for login/register
app.use(protect); // All routes below require authentication
app.use('/api/admin', adminRoutes); // <-- Use admin routes
app.use('/api/customer', customerRoutes); // Register customer routes
app.use('/api/staff', staffRoutes); // Register staff routes
app.use('/api/service', serviceRoutes); // Register service routes
app.use('/api/expense', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/vision', visionRoutes); // ✅ Register Vision routes
app.use('/api/visionid', visionIdRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/centres", centreRoutes);




module.exports = app;
