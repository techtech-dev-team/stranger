const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseDate: { type: Date, required: true },
  paidTo: { type: String, required: true },
  reason: { type: String, required: true },
  amount: { type: Number, required: true },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
