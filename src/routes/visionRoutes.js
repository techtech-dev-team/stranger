const express = require('express');
const { addEntry, getAllEntries, getEntryById, updateEntry, deleteEntry } = require('../controllers/visionController');

const router = express.Router();

// ✅ Add a new entry
router.post('/add', addEntry);

// ✅ Get all entries
router.get('/list', getAllEntries);

// ✅ Get a single entry by ID
router.get('/:id', getEntryById);

// ✅ Update an entry
router.put('/update/:id', updateEntry);

// ✅ Delete an entry
router.delete('/delete/:id', deleteEntry);

module.exports = router;
