const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');

// GET /api/graph/daily/:centreId
router.get('/daily/:centreId', graphController.getDailyGraph);

// GET /api/graph/weekly/:centreId
router.get('/weekly/:centreId', graphController.getWeeklyGraph);

// GET /api/graph/monthly/:centreId
router.get('/monthly/:centreId', graphController.getMonthlyGraph);

module.exports = router;
