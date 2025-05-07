const mongoose = require('mongoose');

const centreBalanceSchema = new mongoose.Schema({
  centreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Centre',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dayBalance: {
    type: Number,
    required: true,
    default: 0,
  }
});

module.exports = mongoose.model('CentreBalance', centreBalanceSchema);
