// models/Panel.js
const mongoose = require('mongoose');
const Centre = require('./Centre');  
const panelSchema = new mongoose.Schema(
  {
    panelName: {
      type: String,
      required: true,
    },
    centerIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Centre', // Corrected to 'Centre' (case-sensitive)
    }],
  },
  { timestamps: true }
);

const Panel = mongoose.model('Panel', panelSchema);

module.exports = Panel;
