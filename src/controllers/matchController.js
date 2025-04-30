const VisionEntry = require("../models/Vision");
const CustomerEntry = require("../models/Customer");

exports.matchEntries = async (req, res) => {
  try {
    const { centreId } = req.query; // Expect centreId from frontend
    if (!centreId) return res.status(400).json({ message: "Centre ID is required" });

    // Extract only the first part (e.g., "001" from "001_MH_MUM_TS")
    const centreCode = centreId.split("_")[0];

    // Fetch all vision entries for the given centreCode
    const visionEntries = await VisionEntry.find({ nameOrCode: centreCode });

    if (!visionEntries.length) {
      return res.status(404).json({ message: "No Vision entries found for this Centre" });
    }

    // Fetch all customer entries for the given centre
    const customerEntries = await CustomerEntry.find({ centreId });

    if (!customerEntries.length) {
      return res.status(404).json({ message: "No Customer entries found for this Centre" });
    }

    let matchedEntries = [];

    // Loop through vision entries to find matches
    for (let vision of visionEntries) {
      let visionTime = new Date(`2025-03-06T${vision.time}:00.000Z`); // Remove 'Z' to keep local time

      for (let customer of customerEntries) {
        let customerTime = new Date(customer.inTime);

        if (isNaN(visionTime.getTime()) || isNaN(customerTime.getTime())) {
          console.error("Invalid time detected!", { visionTime, customerTime });
          continue;
        }

        let timeDifference = Math.abs(visionTime - customerTime) / (1000 * 60);

        

        if (timeDifference <= 15) {
          matchedEntries.push({ vision, customer });
        }
      }
    }


    if (matchedEntries.length === 0) {
      return res.status(404).json({ message: "No matches found within 15 minutes" });
    }

    res.status(200).json({ message: "Matches found", data: matchedEntries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
