const jwt = require('jsonwebtoken');
const express = require('express'); 
dotenv = require('dotenv');
const moment = require('moment');
const Vision = require('../models/Vision');
const User = require('../models/User');
const Centre = require('../models/Centre');
const Customer = require('../models/Customer');
exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Validate credentials
      if (
        username === process.env.LOGIN_API_USERNAME &&
        password === process.env.LOGIN_API_PASSWORD
      ) {
        // Generate a token (optional)
        const token = jwt.sign({ username }, process.env.JWT_SECRET || 'default_secret', {
          expiresIn: '1h',
        });
  
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token, // Return token if needed
        });
      }
  
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  };

exports.getVisionDailyUserReport = async (req, res) => {
  try {
    // Fetch only users with Vision role
    const visionUsers = await User.find({ role: 'Vision' }).select('_id name');

    // Get all Vision entries
    const allEntries = await Vision.find().select('staffId createdAt');

    // Group entries by user and then by date
    const userMap = {};

    allEntries.forEach(entry => {
      const userId = entry.staffId.toString();
      const date = moment(entry.createdAt).format('YYYY-MM-DD');

      if (!userMap[userId]) {
        userMap[userId] = {};
      }

      if (!userMap[userId][date]) {
        userMap[userId][date] = 0;
      }

      userMap[userId][date]++;
    });

    // Format the result
    const report = visionUsers.map(user => {
      const userId = user._id.toString();
      const dateCounts = userMap[userId] || {};

      const dateWiseEntries = Object.entries(dateCounts).map(([date, count]) => ({
        date,
        count,
      }));

      return {
        userId,
        name: user.name,
        dateWiseEntries,
      };
    });

    res.status(200).json({ success: true, data: report });

  } catch (error) {
    console.error("Error generating Vision daily user report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getIdReportUserWise = async (req, res) => {
  try {
    const { date } = req.query;

    // Date filter (optional)
    let dateFilter = {};
    if (date) {
      const formattedDate = moment(date).startOf("day").toISOString();
      const nextDay = moment(date).add(1, "day").startOf("day").toISOString();
      dateFilter = { createdAt: { $gte: formattedDate, $lt: nextDay } };
    }

    // Fetch all users with the "ID" role
    const users = await User.find({ role: "ID" }).select("_id name centreIds");

    // Fetch all centres to get their codes
    const centres = await Centre.find().select("_id centreId");
    const centreMap = centres.reduce((acc, centre) => {
      acc[centre._id.toString()] = centre.centreId;
      return acc;
    }, {});

    // Fetch all customer entries (filtered by date if provided)
    const customerEntries = await Customer.find({
      ...dateFilter,
      status: { $ne: "null" }, // Exclude entries with status = "null"
    }).select("centreId status");

    // Generate the report
    const report = users.map((user) => {
      // Get the list of centre codes the user has access to
      const centreAccess = (user.centreIds || []).map((id) => centreMap[id] || "N/A");

      // Filter customer entries for the centres accessible by this user
      const userEntries = customerEntries.filter((entry) =>
        user.centreIds.some((centreId) => centreId.toString() === entry.centreId.toString())
      );

      // Calculate the number of entries checked and issues raised
      const entriesChecked = userEntries.length;
      const issuesRaised = userEntries.filter((entry) => entry.status !== "All ok").length;

      return {
        userId: user._id,
        name: user.name,
        centreAccess,
        entriesChecked,
        issuesRaised,
      };
    });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching ID report user-wise:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};