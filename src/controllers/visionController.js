const Vision = require("../models/Vision");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Centre = require("../models/Centre");
const mongoose = require("mongoose");

// ✅ Add a new entry with employee ID from token
const moment = require('moment-timezone'); // Install: npm install moment-timezone

const sseClients = [];

exports.sseHandler = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    res.write(`data: ${JSON.stringify({ message: "Connected to SSE" })}\n\n`); // ✅ Proper JSON

    sseClients.push(res);

    req.on("close", () => {
        const index = sseClients.indexOf(res);
        if (index !== -1) sseClients.splice(index, 1);
    });
};

const sendSSEUpdate = (data) => {
    sseClients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

exports.addEntry = async (req, res) => {
  try {
    const { time, nameOrCode, numberOfPeople, status, remark, staffId } = req.body;

    const employeeId = req.user._id;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized: Employee ID missing" });

    if (numberOfPeople < 1) return res.status(400).json({ message: "Number of people must be at least 1" });

    // Get today's date
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Ensure the provided time is in HH:mm:ss format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(time)) return res.status(400).json({ message: "Invalid time format. Expected HH:mm:ss" });

    // Combine date and time, convert to IST (GMT+5:30)
    const formattedTime = moment.tz(`${currentDate}T${time}`, 'Asia/Kolkata').toISOString();

    const entry = new Vision({
      time: formattedTime,
      nameOrCode,
      numberOfPeople,
      status,
      remark,
      staffId: employeeId,
    });

    await entry.save();

    sendSSEUpdate({ message: "New entry added", entry });

    res.status(201).json({ message: "Entry added successfully", entry });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getAllEntries = async (req, res) => {
  try {
    const entries = await Vision.find().sort({ createdAt: -1 });

    if (!entries.length) {
      return res.status(404).json({ message: "No entries found" });
    }

    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllEntriesFast = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required in YYYY-MM-DD format" });
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.time("entries-query");

    const entries = await Vision.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .sort({ createdAt: -1 })
      .lean();

    console.timeEnd("entries-query");

    if (!entries.length) {
      return res.status(404).json({ message: "No entries found for this date" });
    }

    res.status(200).json({
      date,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error("❌ Error fetching entries:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Get a single entry by ID
exports.getEntryById = async (req, res) => {
  try {
    const entry = await Vision.findOne({ _id: req.params.id, staffId: req.user._id });

    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Update an entry
exports.updateEntry = async (req, res) => {
  try {
    const updatedEntry = await Vision.findOneAndUpdate(
      { _id: req.params.id, staffId: req.user._id },
      req.body,
      { new: true }
    );

    if (!updatedEntry) return res.status(404).json({ message: 'Entry not found or unauthorized' });

    res.status(200).json({ message: 'Entry updated successfully', updatedEntry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Delete an entry
exports.deleteEntry = async (req, res) => {
  try {
    const deletedEntry = await Vision.findOneAndDelete({ _id: req.params.id, staffId: req.user._id });

    if (!deletedEntry) return res.status(404).json({ message: 'Entry not found or unauthorized' });

    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Vision Report API
// exports.getVisionReport = async (req, res) => {
//   try {
//     const { date } = req.query;

//     // Date filter (optional)
//     let dateFilter = {};
//     if (date) {
//       const formattedDate = moment(date).startOf("day").toISOString();
//       const nextDay = moment(date).add(1, "day").startOf("day").toISOString();
//       dateFilter = { createdAt: { $gte: formattedDate, $lt: nextDay } };
//     }

//     // Fetch all vision staff
//     const users = await User.find({ role: "Vision" }).select("_id name centreIds");

//     // Fetch all centres to get centre codes
//     const centres = await Centre.find().select("_id centreId");
//     const centreMap = centres.reduce((acc, centre) => {
//       acc[centre._id.toString()] = centre.centreId.split("_")[0]; // Extract first 3 digits
//       return acc;
//     }, {});

//     // Fetch all vision and customer entries (filtered if date is provided)
//     const visionEntries = await Vision.find(dateFilter);
//     const customerEntries = await Customer.find(dateFilter);

//     // Generate report
//     const report = users.map(user => {
//       // Get Camera Access (First three digits of centreIds)
//       const cameraAccess = (user.centreIds || []).map(id => centreMap[id] || "N/A").join(", ");

//       let matchedEntries = 0;
//       let missedEntries = customerEntries.length;

//       visionEntries.forEach(vision => {
//         const visionTime = new Date(vision.time);
//         const matched = customerEntries.some(customer => {
//           const customerTime = new Date(customer.inTime);
//           const timeDifference = Math.abs(visionTime - customerTime) / (1000 * 60);
//           return timeDifference <= 15;
//         });

//         if (matched) matchedEntries += 1;
//       });

//       // Calculate Missed Entries
//       missedEntries -= matchedEntries;

//       return {
//         userId: user._id,
//         name: user.name,
//         cameraAccess,
//         matchedEntries,
//         missedEntries
//       };
//     });

//     res.status(200).json({ success: true, data: report });

//   } catch (error) {
//     console.error("Error fetching vision report:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

exports.getVisionReport = async (req, res) => {
  try {
    // 🗓️ Define a static date range (last 7 days)
    const endDate = moment().endOf("day").toDate();
    const startDate = moment().subtract(6, "days").startOf("day").toDate();

    const dateFilter = { createdAt: { $gte: startDate, $lt: endDate } };

    const users = await User.find({ role: "Vision" }).select("_id name centreIds");

    const centres = await Centre.find().select("_id centreId");
    const centreMap = centres.reduce((acc, centre) => {
      acc[centre._id.toString()] = centre.centreId.split("_")[0];
      return acc;
    }, {});

    const [visionEntries, customerEntries] = await Promise.all([
      Vision.find(dateFilter).select("time createdAt"),
      Customer.find(dateFilter).select("inTime createdAt"),
    ]);

    const groupByDate = (entries, timeField) => {
      return entries.reduce((acc, entry) => {
        const dateKey = moment(entry.createdAt).format("YYYY-MM-DD");
        acc[dateKey] = acc[dateKey] || [];
        acc[dateKey].push(entry[timeField]);
        return acc;
      }, {});
    };

    const visionByDate = groupByDate(visionEntries, "time");
    const customerByDate = groupByDate(customerEntries, "inTime");

    const report = users.map(user => {
      const cameraAccess = (user.centreIds || [])
        .map(id => centreMap[id] || "N/A")
        .join(", ");

      const userReports = [];

      Object.keys(visionByDate).forEach(dateKey => {
        const visionList = visionByDate[dateKey];
        const customerList = customerByDate[dateKey] || [];

        const customerTimeSet = new Set(
          customerList.map(inTime => Math.floor(new Date(inTime).getTime() / (1000 * 60)))
        );

        let matched = 0;
        visionList.forEach(visionTime => {
          const visionMinute = Math.floor(new Date(visionTime).getTime() / (1000 * 60));
          for (let offset = -15; offset <= 15; offset++) {
            if (customerTimeSet.has(visionMinute + offset)) {
              matched++;
              break;
            }
          }
        });

        const missed = customerList.length - matched;

        userReports.push({
          date: dateKey,
          matchedEntries: matched,
          missedEntries: missed
        });
      });

      return {
        userId: user._id,
        name: user.name,
        cameraAccess,
        reports: userReports
      };
    });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching vision report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getTodayVisionReport = async (req, res) => {
  try {
    // Define today's date range
    const startOfDay = moment().startOf("day").toISOString();
    const endOfDay = moment().endOf("day").toISOString();
    const dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };

    // Fetch all vision staff
    const users = await User.find({ role: "Vision" }).select("_id name centreIds");

    // Fetch all centres to get centre codes
    const centres = await Centre.find().select("_id centreId");
    const centreMap = centres.reduce((acc, centre) => {
      acc[centre._id.toString()] = centre.centreId.split("_")[0]; // Extract first 3 digits
      return acc;
    }, {});

    // Fetch today's vision and customer entries
    const visionEntries = await Vision.find(dateFilter);
    const customerEntries = await Customer.find(dateFilter);

    // Generate today's report
    const report = users.map(user => {
      const cameraAccess = (user.centreIds || []).map(id => centreMap[id] || "N/A").join(", ");

      let matchedEntries = 0;
      let missedEntries = customerEntries.length;

      visionEntries.forEach(vision => {
        const visionTime = new Date(vision.time);
        const matched = customerEntries.some(customer => {
          const customerTime = new Date(customer.inTime);
          const timeDifference = Math.abs(visionTime - customerTime) / (1000 * 60);
          return timeDifference <= 15;
        });

        if (matched) matchedEntries += 1;
      });

      missedEntries -= matchedEntries;

      return {
        userId: user._id,
        name: user.name,
        cameraAccess,
        matchedEntries,
        missedEntries
      };
    });

    res.status(200).json({ success: true, data: report });

  } catch (error) {
    console.error("Error fetching today's vision report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};