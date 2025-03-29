const Expense = require('../models/Expense');
const clients = []; // Store SSE clients

// SSE Handler for Real-Time Expense Updates
exports.sseHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push({ res });

  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  });
};

// Function to send SSE event
const sendSSEEvent = (data) => {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Add Expense
exports.addExpense = async (req, res) => {
  try {
    const { expenseDate, paidTo, reason, amount, verified } = req.body;

    const newExpense = new Expense({
      expenseDate,
      paidTo,
      reason,
      amount,
      verified,
      createdBy: req.user._id, // Ensure authenticated user is adding the expense
    });

    await newExpense.save();

    // Send SSE event when a new expense is added
    sendSSEEvent({ message: "New expense added", expense: newExpense });

    res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'An error occurred while adding the expense', error: error.message });
  }
};

// Get Expenses List
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ expenseDate: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Edit Expense
exports.editExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense updated successfully', expense: updatedExpense });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

