const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }, // Reference to service
  duration: { type: Number, enum: [45, 60, 120], required: true },
  inTime: { type: String, required: true }, // Example: "13:00"
  paymentCash1: { type: Number, default: 0 }, // First payment in cash
  paymentOnline1: { type: Number, default: 0 }, // First payment online
  staffAttending: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true }, // Reference to staff
  paymentCash2: { type: Number, default: 0 }, // Second payment in cash
  paymentOnline2: { type: Number, default: 0 }, // Second payment online
  cashCommission: { type: Number, default: 0 }, // Tip given in cash
  onlineCommission: { type: Number, default: 0 }, // Tip given online
  outTime: { type: String, required: true }, // Example: "14:30"
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Centre Manager who added
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
