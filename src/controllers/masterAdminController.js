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
    const customerEntries = await Customer.find({
      verified: true,
    }).select('verifiedBy');

    const reportMap = {};

    customerEntries.forEach(entry => {
      if (!entry.verifiedBy) {
        return;
      }
      const userId = entry.verifiedBy.toString();

      if (!reportMap[userId]) {
        reportMap[userId] = {
          userId,
          count: 0,
        };
      }

      reportMap[userId].count += 1;
    });

    const userIds = Object.keys(reportMap);
    const users = await User.find({ _id: { $in: userIds } }).select('_id name');

    const userNameMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.name;
      return acc;
    }, {});

    const report = Object.values(reportMap).map(item => {
      const name = userNameMap[item.userId] || 'Unknown';

      return {
        userId: item.userId,
        name: name,
        count: item.count,
      };
    });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching accurate report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


