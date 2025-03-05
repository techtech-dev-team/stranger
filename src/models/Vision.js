const mongoose = require('mongoose');

const visionSchema = new mongoose.Schema({
  time: { type: String, required: true }, // Time of entry
  nameOrCode: { type: String, required: true }, // Name or Code
  numberOfPeople: { type: Number, required: true }, // 1-6, or manual entry
  status: {
    type: String,
    required: true,
    enum: ['In', 'Out', 'Return', 'Pending'] // Add "Pending" if needed
  },
  remark: {
    type: String,
    required: true,
    enum: ['Customer', 'Suspicious/Issue', 'Client Issue', 'Staff Crowd', 'No CCTV Vision', 'Auto-generated'] // Add "Auto-generated" if needed
  },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Logged-in employee ID
}, { timestamps: true });

module.exports = mongoose.model('Vision', visionSchema);
