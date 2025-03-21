const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  duration: { type: String, required: true },
  inTime: { type: Date, required: true }, 
  paymentCash1: { type: Number, default: 0 },
  paymentOnline1: { type: Number, default: 0 },
  staffAttending: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentCash2: { type: Number, default: 0 },
  paymentOnline2: { type: Number, default: 0 },
  cashCommission: { type: Number, default: 0 },
  onlineCommission: { type: Number, default: 0 },
  outTime: { type: Date, required: false }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  status: { type: String, default: "null" },
  remark: { type: String },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
    