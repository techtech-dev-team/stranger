const express = require('express');
const { addExpense, getAllExpenses, getExpenseById, updateExpense, deleteExpense } = require('../controllers/expenseController');

const router = express.Router();

router.post('/add', addExpense);
router.get('/list', getAllExpenses);
router.get('/:id', getExpenseById);
router.put('/update/:id', updateExpense);
router.delete('/delete/:id', deleteExpense);

module.exports = router;
