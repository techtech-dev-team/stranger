const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { addExpense, getExpenses, getExpenseById, editExpense, sseHandler , getExpensesByCentre} = require('../controllers/expenseController');

const router = express.Router();

// SSE Endpoint for real-time updates
router.get('/sse', sseHandler);

router.post('/add', protect, addExpense);
router.get('/list', protect, getExpenses);
router.get('/centre/:centreId', protect, getExpensesByCentre);
router.get('/:id', protect, getExpenseById);
router.put('/:id', protect, editExpense);


module.exports = router;
