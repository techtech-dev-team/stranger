const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  loginId: { type: String, required: true, unique: true, minlength: 8, maxlength: 8 },
  pin: { type: String, required: true }, // Hashed PIN, so no maxlength
  role: { 
    type: String, 
    required: true, 
    enum: ['CM', 'ARM', 'Vision', 'ID', 'Admin'] 
  },
});

module.exports = mongoose.model('User', userSchema);
