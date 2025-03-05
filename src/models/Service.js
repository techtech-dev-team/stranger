const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true } // Service name
});

module.exports = mongoose.model('Service', serviceSchema);
