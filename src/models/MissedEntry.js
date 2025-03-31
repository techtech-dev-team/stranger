const mongoose = require('mongoose');

const missedEntrySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  visionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vision', required: false },
  type: { type: String, enum: ['Centre Missed', 'Vision Missed'], required: true },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

missedEntrySchema.pre(/^find/, function (next) {
  this.populate('customerId visionId');
  next();
});

module.exports = mongoose.model('MissedEntry', missedEntrySchema);
