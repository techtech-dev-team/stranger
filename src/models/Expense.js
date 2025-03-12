const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseDate: { type: Date, required: true },
  paidTo: { type: String, required: true },
  reason: { type: String, required: true },
  amount: { type: Number, required: true },
  verified: { type: Boolean, default: false },
  regionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Region' }],
  branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  centreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Centre' }]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
