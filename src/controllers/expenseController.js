const Expense = require('../models/Expense');

exports.addExpense = async (req, res) => {
  try {
    const { expenseDate, paidTo, reason, amount, verified, regionIds, branchIds, centreIds } = req.body;
    console.log(req.body);
    
    const newExpense = new Expense({
      expenseDate,
      paidTo,
      reason,
      amount,
      verified,
      regionIds,
      branchIds,
      centreIds
    });

    await newExpense.save();
    res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
    console.log(newExpense);
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('regionIds')
      .populate('branchIds')
      .populate('centreIds')
      .sort({ expenseDate: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('regionIds')
      .populate('branchIds')
      .populate('centreIds');

    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.updateExpense = async (req, res) => {
  try {
    const { expenseDate, paidTo, reason, amount, verified, regionIds, branchIds, centreIds } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, {
      expenseDate,
      paidTo,
      reason,
      amount,
      verified,
      regionIds,
      branchIds,
      centreIds
    }, { new: true });

    if (!updatedExpense) return res.status(404).json({ message: 'Expense not found' });

    res.status(200).json({ message: 'Expense updated successfully', expense: updatedExpense });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
