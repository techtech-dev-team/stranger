const mongoose = require("mongoose");
const Customer = require("../models/Customer");

const getTopCentresBySales = async (req, res) => {
  try {
    const topCentres = await Customer.aggregate([
      {
        $group: {
          _id: "$centreId",
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalSales: {
            $sum: {
              $add: [
                "$paymentCash1",
                "$paymentCash2",
                "$paymentOnline1",
                "$paymentOnline2"
              ]
            }
          }
        }
      },
      { $sort: { totalSales: -1 } }, // Sort by total sales (High to Low)
      { $limit: 4 }, // Get only top 4 centres
      {
        $lookup: {
          from: "centres", // Ensure your Centre model's collection name matches this
          localField: "_id",
          foreignField: "_id",
          as: "centreDetails"
        }
      },
      {
        $unwind: {
          path: "$centreDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          centreId: "$_id",
          centreName: "$centreDetails.name",
          totalCash: 1,
          totalOnline: 1,
          totalSales: 1
        }
      }
    ]);

    res.status(200).json({
      message: "Top 4 centres by sales retrieved successfully",
      topCentres
    });

  } catch (error) {
    console.error("Error fetching top centres:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBottomCentresBySales = async (req, res) => {
  try {
    const bottomCentres = await Customer.aggregate([
      {
        $group: {
          _id: "$centreId",
          totalCash: { $sum: { $add: ["$paymentCash1", "$paymentCash2"] } },
          totalOnline: { $sum: { $add: ["$paymentOnline1", "$paymentOnline2"] } },
          totalSales: {
            $sum: {
              $add: [
                "$paymentCash1",
                "$paymentCash2",
                "$paymentOnline1",
                "$paymentOnline2"
              ]
            }
          }
        }
      },
      { $sort: { totalSales: 1 } }, // Low to High
      { $limit: 4 }, // Get Bottom 4 Centres
      {
        $lookup: {
          from: "centres",
          localField: "_id",
          foreignField: "_id",
          as: "centreDetails"
        }
      },
      { $unwind: { path: "$centreDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          centreId: "$_id",
          centreName: "$centreDetails.name",
          totalCash: 1,
          totalOnline: 1,
          totalSales: 1
        }
      }
    ]);

    res.status(200).json({
      message: "Bottom 4 centres by sales retrieved successfully",
      bottomCentres
    });

  } catch (error) {
    console.error("Error fetching bottom centres:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCentresWithSuddenHike = async (req, res) => {
  try {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 14); // 14 days ago
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7); // 7 days ago

    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - 7); // 7 days ago (starting current week)

    // Aggregation pipeline
    const salesData = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeekStart }, // Only consider last 14 days of data
        },
      },
      {
        $group: {
          _id: {
            centreId: "$centreId",
            week: {
              $cond: [
                { $gte: ["$createdAt", currentWeekStart] }, // If within current week
                "current",
                "last",
              ],
            },
          },
          totalSales: {
            $sum: {
              $add: [
                "$paymentCash1",
                "$paymentCash2",
                "$paymentOnline1",
                "$paymentOnline2",
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.centreId",
          lastWeekSales: {
            $sum: {
              $cond: [{ $eq: ["$_id.week", "last"] }, "$totalSales", 0],
            },
          },
          currentWeekSales: {
            $sum: {
              $cond: [{ $eq: ["$_id.week", "current"] }, "$totalSales", 0],
            },
          },
        },
      },
      {
        $project: {
          centreId: "$_id",
          lastWeekSales: 1,
          currentWeekSales: 1,
          increasePercentage: {
            $cond: [
              { $gt: ["$lastWeekSales", 0] }, // Avoid division by zero
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ["$currentWeekSales", "$lastWeekSales"] },
                      "$lastWeekSales",
                    ],
                  },
                  100,
                ],
              },
              0, // If last week's sales were 0, set increasePercentage to 0
            ],
          },
        },
      },
      {
        $match: {
          increasePercentage: { $gte: 10 }, // Only centres with 10% or more increase
        },
      },
      { $sort: { increasePercentage: -1 } }, // Sort by highest hike first
      {
        $lookup: {
          from: "centres",
          localField: "centreId",
          foreignField: "_id",
          as: "centreDetails",
        },
      },
      { $unwind: { path: "$centreDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          centreId: 1,
          centreName: "$centreDetails.name",
          lastWeekSales: 1,
          currentWeekSales: 1,
          increasePercentage: 1,
        },
      },
    ]);

    res.status(200).json({
      message: "Centres with sudden sales hike retrieved successfully",
      salesData,
    });
  } catch (error) {
    console.error("Error fetching sudden hike centres:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = { getTopCentresBySales, getBottomCentresBySales, getCentresWithSuddenHike };
