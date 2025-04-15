const mongoose = require('mongoose');

const visionSchema = new mongoose.Schema({
  time: { type: String, required: true }, // Time in ISO format
  nameOrCode: { type: String, required: true }, // Name or Code
  numberOfPeople: { type: Number, required: true, min: 1 }, // 1-6, or manual entry
  status: {
    type: String,
    required: true,
    enum: ['In', 'Out', 'Return', 'Pending']
  },
  remark: {
    type: String,
    required: true,
    enum: ["Customer",
        "Suspicious / Issue",
        "Client Issue",
        "Staff Crowd",
        "No CCTV Vision",
        "Vendor",
        "Clenaing",
        "Maintenance",]
  },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Vision', visionSchema);
