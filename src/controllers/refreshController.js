// controllers/refreshController.js
let lastRefreshed = new Date();

const refreshData = async (req, res, next) => {
  try {


    // Example: Fetch necessary data or perform recalculations here
    // You can refresh things like Branches, Centres, Reports, etc.
    // await someModel.find({});

    lastRefreshed = new Date();


    next(); // Continue to the actual API after refreshing
  } catch (error) {
    console.error("Error refreshing data:", error);
    res.status(500).json({ message: "Failed to refresh data" });
  }
};

module.exports = { refreshData, lastRefreshed };
