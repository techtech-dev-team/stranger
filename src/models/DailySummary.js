const mongoose = require("mongoose");

const dailySummarySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: false // Allow multiple summaries per date (one per centre)
  },
  centreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Centre",
    required: true // Track per centre
  },
  totalCash: {
    type: Number,
    required: true,
    default: 0
  },
  totalOnline: {
    type: Number,
    required: true,
    default: 0
  },
  totalOnlineCommission: {
    type: Number,
    required: true,
    default: 0
  },
  totalCashCommission: {
    type: Number,
    required: true,
    default: 0
  },
  totalExpense: {
    type: Number,
    required: true,
    default: 0
  },
  
  istDateString: {
  type: String, // e.g., "2025-05-13"
  required: true
},
customerCount: {
    type: Number,
    required: true,
    default: 0
  }

});

module.exports = mongoose.model("DailySummary", dailySummarySchema);