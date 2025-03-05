const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  aadharOrPanNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  staffRole: { 
    type: String, 
    required: true, 
    enum: ['Club Staff', 'Manager'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  },
  attendance: {
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    totalWorkingDays: { type: Number, default: 26 }
  }
});

module.exports = mongoose.model('Staff', staffSchema);
