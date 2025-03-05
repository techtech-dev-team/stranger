const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/admin-dashboard', protect, (req, res) => {
  res.json({ message: 'Admin dashboard accessed' });
});

module.exports = router;
