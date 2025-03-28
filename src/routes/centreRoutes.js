const express = require("express");
const mongoose = require("mongoose");
const { getAllCentres, getCentreById, getInactiveCentres, getActiveCentres, getCombinedMonthlySalesByCentre, getMonthlySalesByCentre, getCombinedMonthlyClientsByCentre, getMonthlyClientsByCentre, getCentreStatistics } = require("../controllers/centreController");
const Centre = require("../models/Centre");
const Customer = require("../models/Customer");
const Expense = require("../models/Expense");
const moment = require("moment");

const router = express.Router();

router.get("/centre-stats", getCentreStatistics);
router.get("/monthly-sales", getMonthlySalesByCentre);
router.get("/combined-sales", getCombinedMonthlySalesByCentre);
router.get("/monthly-clients", getMonthlyClientsByCentre);
router.get("/combined-clients", getCombinedMonthlyClientsByCentre);
router.get("/", getAllCentres);
router.post('/', async (req, res) => {
    const { name, shortCode, centreId, branchName, payCriteria, regionId, branchId, status } = req.body;

    try {
        const newCentre = new Centre({
            name,
            shortCode,
            centreId,
            branchName,
            payCriteria,
            regionId,
            branchId,
            status
        });

        await newCentre.save();
        res.status(201).json({ message: "Centre added successfully", centre: newCentre });
    } catch (error) {
        console.log(error);  // Log the error details
        res.status(500).json({ message: "Error adding centre", error: error.message });
    }
});
router.get("/:id", getCentreById);
router.get("/inactive/list", getInactiveCentres);
router.get("/active/list", getActiveCentres);
router.get("/report/:centerId", async (req, res) => {
    try {
        const { centerId } = req.params;
        const { selectedDate } = req.query; // Get selected date

        // Check if centerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(centerId)) {
            return res.status(400).json({ success: false, message: "Invalid center ID" });
        }

        const centerObjectId = new mongoose.Types.ObjectId(centerId);

        // Fetch center data and populate necessary fields
        const center = await Centre.findById(centerObjectId).lean();

        if (!center) {
            return res.status(404).json({ success: false, message: "Center not found" });
        }

        // Construct date filter
        const matchCondition = { centreId: centerObjectId };
        if (selectedDate) {
            const dateStart = new Date(selectedDate);
            dateStart.setHours(0, 0, 0, 0);

            const dateEnd = new Date(selectedDate);
            dateEnd.setHours(23, 59, 59, 999);

            matchCondition.createdAt = { $gte: dateStart, $lte: dateEnd };
        }

        // Get sales data for the center using aggregation
        const salesReport = await Customer.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
                    totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
                    totalCashCommission: { $sum: "$cashCommission" },
                    totalOnlineCommission: { $sum: "$onlineCommission" },
                    totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCustomers: 1,
                    totalCash: 1,
                    totalOnline: 1,
                    totalCashCommission: 1,
                    totalOnlineCommission: 1,
                    totalCommission: 1,
                    grandTotal: {
                        $cond: {
                            if: { $eq: [center.payCriteria, "plus"] },
                            then: {
                                $subtract: [
                                    { $add: ["$totalCash", "$totalOnline"] },
                                    "$totalCommission"
                                ]
                            },
                            else: { $add: ["$totalCash", "$totalOnline"] }
                        }
                    },
                    balance: {
                        $cond: {
                            if: { $eq: [center.payCriteria, "plus"] },
                            then: { $subtract: ["$totalCash", "$totalCashCommission"] },
                            else: "$totalCash"
                        }
                    }
                }
            }
        ]);

        let previousBalance = center.previousBalance || 0;
        let balance = previousBalance;
        if (salesReport.length > 0) {
            balance += salesReport[0].grandTotal;
        }

        // Update Centre balance
        await Centre.findByIdAndUpdate(center._id, { previousBalance, balance });

        // Fetch Customers data with populated fields, applying date filter
        const customers = await Customer.find(matchCondition)
            .populate("service", "name price")  // Populating service details
            .populate("staffAttending", "name role")  // Populating staff details
            .lean();

        // Fetch Expenses for the center, applying date filter
        const expenseMatchCondition = { centreIds: centerObjectId };
        if (selectedDate) {
            const dateStart = new Date(selectedDate);
            dateStart.setHours(0, 0, 0, 0);
            
            const dateEnd = new Date(selectedDate);
            dateEnd.setHours(23, 59, 59, 999);
            
            expenseMatchCondition.createdAt = { $gte: dateStart, $lte: dateEnd };
        }
        
        const expenses = await Expense.find(expenseMatchCondition).lean();
                const totalExpense = expenses.reduce((total, expense) => total + (expense.amount || 0), 0);

        // Prepare the response data
        res.status(200).json({
            success: true,
            data: {
                centreName: center.name,
                totalSales: salesReport[0]?.grandTotal || 0,
                totalCustomers: salesReport[0]?.totalCustomers || 0,
                totalCash: salesReport[0]?.totalCash || 0,
                totalOnline: salesReport[0]?.totalOnline || 0,
                totalCommission: salesReport[0]?.totalCommission || 0,
                expensesTotal: totalExpense,
                cashCommission: salesReport[0]?.totalCashCommission || 0,
                onlineComm: salesReport[0]?.totalOnlineCommission || 0,
                balance,
                centerDetails: center, // Include the full populated center data
                customers,             // Include populated customer data with date filter
                expenses,              // Include expenses data with date filter
                salesReport            // Include aggregated sales report
            }
        });
    } catch (error) {
        console.error(`Error fetching report for Center ID ${req.params.centerId}:`, error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.put('/:centreId', async (req, res) => {
    const { centreId } = req.params;
    const { name, shortCode, CentreID, payCriteria, regionId, branchId } = req.body;

    try {
        const updatedCentre = await Centre.findByIdAndUpdate(
            centreId,
            { name, shortCode, CentreID, payCriteria, regionId, branchId },
            { new: true }
        );

        if (!updatedCentre) {
            return res.status(404).json({ message: "Centre not found" });
        }

        res.json({ message: "Centre updated successfully", centre: updatedCentre });
    } catch (error) {
        res.status(500).json({ message: "Error updating centre", error: error.message });
    }
});
router.put("/:centreId/status", async (req, res) => {
    try {
        const { status } = req.body;
        const centre = await Centre.findByIdAndUpdate(
            req.params.centreId,
            { status },
            { new: true }
        );
        if (!centre) return res.status(404).send("Centre not found");
        res.json(centre);
    } catch (error) {
        res.status(400).send("Error updating status");
    }
});
router.delete("/:centreId", async (req, res) => {
    try {
        const centre = await Centre.findByIdAndDelete(req.params.centreId);
        if (!centre) return res.status(404).send("Centre not found");
        res.json({ message: "Centre deleted successfully" });
    } catch (error) {
        res.status(400).send("Error deleting centre");
    }
});
router.get("/previous-three-days-sales/:centerId", async (req, res) => {
    try {
        const { centerId } = req.params;

        // Validate centreId
        if (!mongoose.Types.ObjectId.isValid(centerId)) {
            return res.status(400).json({ success: false, message: "Invalid center ID" });
        }

        const centerObjectId = new mongoose.Types.ObjectId(centerId);

        // Fetch payCriteria to handle "plus" and "minus" logic
        const centre = await Centre.findById(centerObjectId);
        if (!centre) {
            return res.status(404).json({ success: false, message: "Centre not found" });
        }

        // Calculate date range: past 3 days
        const today = moment().endOf("day");  // Include today till the end
        const threeDaysAgo = moment().subtract(2, "days").startOf("day");  // Past 2 days + today


        // Aggregation to get sales data for the last 3 days
        const salesData = await Customer.aggregate([
            {
                $match: {
                    centreId: centerObjectId,
                    createdAt: { $gte: threeDaysAgo.toDate(), $lt: today.toDate() }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalCustomers: { $sum: 1 },
                    totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
                    totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
                    totalCommission: { $sum: { $add: ["$cashCommission", "$onlineCommission"] } },
                }
            },
            {
                $project: {
                    _id: 1,
                    totalCustomers: 1,
                    totalCash: 1,
                    totalOnline: 1,
                    totalCommission: 1,
                    grandTotal: {
                        $cond: {
                            if: { $eq: [centre.payCriteria, "plus"] },
                            then: {
                                $subtract: [
                                    { $add: ["$totalCash", "$totalOnline"] },
                                    "$totalCommission"
                                ]
                            },
                            else: { $add: ["$totalCash", "$totalOnline"] }
                        }
                    }
                }
            },
            { $sort: { _id: 1 } } // Sort by date ascending
        ]);

        res.status(200).json({
            success: true,
            centerId,
            salesData
        });

    } catch (error) {
        console.error(`Error fetching previous three days' sales for Center ID ${req.params.centerId}:`, error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


module.exports = router;
