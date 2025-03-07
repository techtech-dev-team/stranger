const Vision = require('../models/Vision');

// ✅ Add a new entry with employee ID from token
exports.addEntry = async (req, res) => {
  try {
    const { time, nameOrCode, numberOfPeople, status, remark, staffId } = req.body;

    // Extract employeeId from logged-in user
    const employeeId = req.user._id;

    if (!employeeId) {
      return res.status(401).json({ message: "Unauthorized: Employee ID missing" });
    }

    if (numberOfPeople < 1) {
      return res.status(400).json({ message: "Number of people must be at least 1" });
    }

    // Set today's date and replace time manually provided
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const formattedTime = `${currentDate}T${time}:00.000+00:00`;

    const entry = new Vision({
      time: formattedTime,
      nameOrCode,
      numberOfPeople,
      status,
      remark,
      staffId,
    });

    await entry.save();
    res.status(201).json({ message: "Entry added successfully", entry });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all entries
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
