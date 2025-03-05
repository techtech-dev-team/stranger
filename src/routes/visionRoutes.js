const express = require('express');
const { addEntry, getAllEntries, getEntryById, updateEntry, deleteEntry } = require('../controllers/visionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Add a new entry (Logged-in user required)
router.post('/add', protect, addEntry);

// ✅ Get all entries for the logged-in user
router.get('/list', protect, getAllEntries);

// ✅ Get a single entry by ID (only if it belongs to logged-in user)
router.get('/:id', protect, getEntryById);

// ✅ Update an entry (only if it belongs to logged-in user)
router.put('/update/:id', protect, updateEntry);

// ✅ Delete an entry (only if it belongs to logged-in user)
router.delete('/delete/:id', protect, deleteEntry);

module.exports = router;
