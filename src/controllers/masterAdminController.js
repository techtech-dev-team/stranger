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
    const { selectedDate } = req.query;

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid date to generate the report.',
      });
    }

    const startOfDay = moment.utc(selectedDate).startOf('day').toDate();
    const endOfDay = moment.utc(selectedDate).endOf('day').toDate();

    // Fetch ALL customers created on selected date (no verified filter)
    const customerEntries = await Customer.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).select('verifiedBy createdAt status');

    const reportMap = {};
    const totalCustomerCounts = {}; // Day-wise count

    customerEntries.forEach(entry => {
      const date = moment(entry.createdAt).format('YYYY-MM-DD');

      // Count total customers per day
      if (!totalCustomerCounts[date]) {
        totalCustomerCounts[date] = 0;
      }
      totalCustomerCounts[date]++;

      // Skip if no verifiedBy user
      if (!entry.verifiedBy) return;

      const userId = entry.verifiedBy.toString();

      // Init user entry
      if (!reportMap[userId]) {
        reportMap[userId] = {
          userId,
          dateWiseCounts: {},
          issueCounts: {},
        };
      }

      // Count per user per day
      if (!reportMap[userId].dateWiseCounts[date]) {
        reportMap[userId].dateWiseCounts[date] = 0;
      }
      reportMap[userId].dateWiseCounts[date]++;

      // Handle issues (status != "All ok" and not null)
      const status = entry.status ? entry.status.trim().toLowerCase() : '';
      if (status && status !== 'all ok') {
        if (!reportMap[userId].issueCounts[date]) {
          reportMap[userId].issueCounts[date] = 0;
        }
        reportMap[userId].issueCounts[date]++;
      }
    });

    // Get user names
    const userIds = Object.keys(reportMap);
    const users = await User.find({ _id: { $in: userIds } }).select('_id name');
    const userNameMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.name;
      return acc;
    }, {});

    // Prepare final report
    const report = Object.values(reportMap).map(item => {
      const name = userNameMap[item.userId] || 'Unknown';

      const dateWiseEntries = Object.entries(item.dateWiseCounts).map(([date, count]) => ({
        date,
        count,
      }));

      const issueEntries = Object.entries(item.issueCounts).map(([date, count]) => ({
        date,
        count,
      }));

      return {
        userId: item.userId,
        name,
        dateWiseEntries,
        issueEntries,
      };
    });

    // Format total customers day-wise
    const totalCustomers = Object.entries(totalCustomerCounts).map(([date, count]) => ({
      date,
      count,
    }));

    const overallTotalCustomers = totalCustomerCounts[moment(selectedDate).format('YYYY-MM-DD')] || 0;

    res.status(200).json({
      success: true,
      data: report,
      totalCustomers,
      overallTotalCustomers,
    });

  } catch (error) {
    console.error('Error fetching accurate report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



