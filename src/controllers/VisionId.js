const Customer = require('../models/Customer');
const Vision = require('../models/Vision');
const User = require("../models/User");
const Centre = require("../models/Centre");
const mongoose = require("mongoose");
const moment = require("moment");

const clients = []; // Store SSE clients

// SSE Handler
exports.sseHandler = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    req.on('close', () => {
        clients.splice(clients.indexOf(res), 1);
    });
};

// Function to send SSE events
const sendSSEEvent = (data) => {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

// ID Report API
exports.getIdReport = async (req, res) => {
    try {
        const { date } = req.query;

        // Date filter (optional)
        let dateFilter = {};
        if (date) {
            const formattedDate = moment(date).startOf("day").toISOString();
            const nextDay = moment(date).add(1, "day").startOf("day").toISOString();
            dateFilter = { createdAt: { $gte: formattedDate, $lt: nextDay } };
        }

        // Fetch all ID users
        const users = await User.find({ role: "ID" }).select("_id name centreIds");

        // Fetch all centres to get centre codes
        const centres = await Centre.find().select("_id centreId");
        const centreMap = centres.reduce((acc, centre) => {
            acc[centre._id.toString()] = centre.centreId;
            return acc;
        }, {});

        // Fetch all customer entries (filtered if date is provided)
        const customerEntries = await Customer.find({
            ...dateFilter,
            status: { $ne: "null" }, // Exclude entries with status = "null"
        }).select("centreId status");

        // Generate report
        const report = users.map((user) => {
            // Get Centre Access (List of centreIds)
            const centreAccess = (user.centreIds || []).map((id) => centreMap[id] || "N/A");

            // Filter customer entries for this user's accessible centres
            const userEntries = customerEntries.filter((entry) =>
                user.centreIds.some((centreId) => centreId.toString() === entry.centreId.toString())
            );

            // Calculate Entries Checked and Issues Raised
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
        console.error("Error fetching ID report:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateCustomerStatus = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { status, remark, verified } = req.body;

        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { status, remark, verified },
            { new: true }
        );

        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Send SSE event
        sendSSEEvent({ message: 'Customer status updated', customer });

        res.status(200).json({ message: 'Customer updated successfully', customer });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getCustomerStatuses = async (req, res) => {
    try {
        const customers = await Customer.find({}, 'status remark verified'); // Fetch only required fields

        res.status(200).json({ customers });
    } catch (error) {
        console.error('Error fetching customer statuses:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
