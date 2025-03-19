const express = require("express");
const mongoose = require("mongoose");
const { getAllCentres, getCentreById, getInactiveCentres, getActiveCentres  , getCombinedMonthlySalesByCentre , getMonthlySalesByCentre , getCombinedMonthlyClientsByCentre , getMonthlyClientsByCentre } = require("../controllers/centreController");
const Centre = require("../models/Centre");
const Customer = require("../models/Customer");
const Expense = require("../models/Expense");

const router = express.Router();

router.get("/monthly-sales", getMonthlySalesByCentre);
router.get("/combined-sales", getCombinedMonthlySalesByCentre);
router.get("/monthly-clients", getMonthlyClientsByCentre);
router.get("/combined-clients", getCombinedMonthlyClientsByCentre);
router.get("/", getAllCentres);
router.get("/:id", getCentreById);
router.get("/inactive/list", getInactiveCentres);
router.get("/active/list", getActiveCentres);
router.get("/report/:centerId", async (req, res) => {
    try {
        const { centerId } = req.params;

        // Check if centerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(centerId)) {
            return res.status(400).json({ success: false, message: "Invalid center ID" });
        }

        const centerObjectId = new mongoose.Types.ObjectId(centerId);

        // Fetch center data and populate necessary fields
        const center = await Centre.findById(centerObjectId)
            .populate("") // Assuming there's a related address document
            .lean();

        if (!center) {
            return res.status(404).json({ success: false, message: "Center not found" });
        }

        // Get sales data for the center using aggregation
        const salesReport = await Customer.aggregate([
            { $match: { centreId: centerObjectId } },
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

        // Fetch Customers data with populated fields
        const customers = await Customer.find({ centreId: centerObjectId })
            .populate("service", "name price")  // Populating service details
            .populate("staffAttending", "name role")  // Populating staff details
            .lean();

        // Fetch Expenses for the center
        const expenses = await Expense.find({ centreIds: centerObjectId }).lean();
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
                customers,             // Include populated customer data
                expenses,              // Include expenses data
                salesReport           // Include aggregated sales report
            }
        });
    } catch (error) {
        console.error(`Error fetching report for Center ID ${req.params.centerId}:`, error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});




module.exports = router;
