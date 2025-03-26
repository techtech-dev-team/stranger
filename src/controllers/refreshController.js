// controllers/refreshController.js
let lastRefreshed = new Date();

const refreshData = async (req, res, next) => {
  try {
    console.log("Refreshing data...");

    // Example: Fetch necessary data or perform recalculations here
    // You can refresh things like Branches, Centres, Reports, etc.
    // await someModel.find({});
    
    lastRefreshed = new Date();
    console.log("Data refreshed at:", lastRefreshed);
    
    next(); // Continue to the actual API after refreshing
  } catch (error) {
    console.error("Error refreshing data:", error);
    res.status(500).json({ message: "Failed to refresh data" });
  }
};

module.exports = { refreshData, lastRefreshed };
