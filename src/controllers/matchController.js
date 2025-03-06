const Customer = require('../models/Customer');
const Vision = require('../models/Vision');

exports.matchCustomerVisionEntries = async (req, res) => {
  try {
    const { branchId, centreId, regionId } = req.query;

    if (!branchId || !centreId || !regionId) {
      return res.status(400).json({ message: "Branch, Centre, and Region filters are required" });
    }

    const customers = await Customer.find({ branchId, centreId, regionId }).lean();
    const visionEntries = await Vision.find({}).lean();

    const matchedEntries = [];

    customers.forEach(customer => {
      const customerTime = new Date(customer.inTime);
      const customerOutTime = new Date(customer.outTime);
      
      const matchedVision = visionEntries.find(vision => {
        const visionTime = new Date(vision.time);
        const timeDiffInMinutes = Math.abs((visionTime - customerTime) / (1000 * 60)); // Difference in minutes
        const outTimeDiffInMinutes = Math.abs((visionTime - customerOutTime) / (1000 * 60));

        return (
          vision.nameOrCode === customer.name ||
          vision.nameOrCode === customer.number
        ) && (
          timeDiffInMinutes <= 15 || outTimeDiffInMinutes <= 15
        );
      });

      if (matchedVision) {
        matchedEntries.push({
          customer,
          vision: matchedVision
        });
      }
    });

    res.status(200).json({ matchedEntries });

  } catch (error) {
    console.error('Error matching customer and vision entries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
