const Vision = require('../models/Vision');

// ✅ Add a new entry
exports.addEntry = async (req, res) => {
  try {
    const { time, nameOrCode, numberOfPeople, status, remark } = req.body;

    if (numberOfPeople < 1) {
      return res.status(400).json({ message: 'Number of people must be at least 1' });
    }

    const entry = new Vision({ time, nameOrCode, numberOfPeople, status, remark });
    await entry.save();

    res.status(201).json({ message: 'Entry added successfully', entry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get all entries
exports.getAllEntries = async (req, res) => {
  try {
    const entries = await Vision.find().sort({ createdAt: -1 }); // Latest entries first
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get a single entry by ID
exports.getEntryById = async (req, res) => {
  try {
    const entry = await Vision.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Update an entry
exports.updateEntry = async (req, res) => {
  try {
    const updatedEntry = await Vision.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEntry) return res.status(404).json({ message: 'Entry not found' });

    res.status(200).json({ message: 'Entry updated successfully', updatedEntry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Delete an entry
exports.deleteEntry = async (req, res) => {
  try {
    const deletedEntry = await Vision.findByIdAndDelete(req.params.id);
    if (!deletedEntry) return res.status(404).json({ message: 'Entry not found' });

    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
