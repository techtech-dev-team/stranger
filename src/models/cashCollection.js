const mongoose = require("mongoose");

const cashCollectionSchema = new mongoose.Schema({
  centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
  amountReceived: { type: Number, required: true }, // Amount collected
  fromDate: { type: Date, required: true }, // Collection period start date
  toDate: { type: Date, required: true }, // Collection period end date
  amountReceivingDate: { type: Date, required: true }, // When amount was received
  remark: { type: String, default: "" }, // Additional remarks
  createdAt: { type: Date, default: Date.now } // Timestamp of entry
});

module.exports = mongoose.model("CashCollection", cashCollectionSchema);
