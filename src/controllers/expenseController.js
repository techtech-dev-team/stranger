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
// Add Expense
exports.addExpense = async (req, res) => {
  try {
    const { expenseDate, paidTo, reason, amount, verified, regionIds, branchIds, centreIds } = req.body;

    const newExpense = new Expense({
      expenseDate,
      paidTo,
      reason,
      amount,
      verified,
      regionIds: regionIds || [],
      branchIds: branchIds || [],
      centreIds: centreIds || [],
      createdBy: req.user._id,
    });

    await newExpense.save();

    // Populate the newly saved expense
    const populatedExpense = await Expense.findById(newExpense._id)
      .populate('regionIds')
      .populate('branchIds')
      .populate('centreIds');

    // Send SSE event with populated data
    sendSSEEvent({ message: "New expense added", expense: populatedExpense });

    res.status(201).json({ message: 'Expense added successfully', expense: populatedExpense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'An error occurred while adding the expense', error: error.message });
  }
};



// Get Expenses List
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('regionIds')
      .populate('branchIds')
      .populate('centreIds')
      .sort({ expenseDate: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
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

exports.editExpense = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Updating expense with ID:", id);
    const updates = req.body;
    const updatedExpense = await Expense.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedExpense) {
      console.log("Expense not found:", id);
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(200).json({ message: "Expense updated successfully", expense: updatedExpense });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

