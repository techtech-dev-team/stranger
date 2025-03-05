const Vision = require('../models/Vision');

// ✅ Add a new entry with employee ID from token

exports.addEntry = async (req, res) => {
  try {
    const { time, nameOrCode, numberOfPeople, status, remark } = req.body;

    // Extract employeeId from logged-in user
    const employeeId = req.user._id; // Ensure req.user is set by authentication middleware

    if (!employeeId) {
      return res.status(401).json({ message: "Unauthorized: Employee ID missing" });
    }

    if (numberOfPeople < 1) {
      return res.status(400).json({ message: "Number of people must be at least 1" });
    }

    const entry = new Vision({ time, nameOrCode, numberOfPeople, status, remark, employeeId });
    await entry.save();

    res.status(201).json({ message: "Entry added successfully", entry });
  } catch (error) {
    console.error("Server error:", error); // Log the full error
    res.status(500).json({ message: "Server error", error: error.message });
}

};


// ✅ Get all entries for logged-in user
exports.getAllEntries = async (req, res) => {
  try {
    const entries = await Vision.find({ employeeId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get a single entry by ID (only if it belongs to the logged-in user)
exports.getEntryById = async (req, res) => {
  try {
    const entry = await Vision.findOne({ _id: req.params.id, employeeId: req.user.userId });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Update an entry (only if it belongs to the logged-in user)
exports.updateEntry = async (req, res) => {
  try {
    const updatedEntry = await Vision.findOneAndUpdate(
      { _id: req.params.id, employeeId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!updatedEntry) return res.status(404).json({ message: 'Entry not found or unauthorized' });

    res.status(200).json({ message: 'Entry updated successfully', updatedEntry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Delete an entry (only if it belongs to the logged-in user)
exports.deleteEntry = async (req, res) => {
  try {
    const deletedEntry = await Vision.findOneAndDelete({ _id: req.params.id, employeeId: req.user.userId });

    if (!deletedEntry) return res.status(404).json({ message: 'Entry not found or unauthorized' });

    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
