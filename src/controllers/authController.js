const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

exports.generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


exports.register = async (req, res) => {
  try {
    const { loginId, pin, role } = req.body;

    if (!loginId || !pin || !role) {
      return res.status(400).json({ message: 'Login ID, PIN, and Role are required' });
    }

    let user = await User.findOne({ loginId });
    if (user) return res.status(400).json({ message: 'User already exists' });

    if (!['CM', 'ARM', 'Vision', 'ID', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    user = new User({ loginId, pin: hashedPin, role });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};


exports.login = async (req, res) => {
  try {
    const { loginId, pin } = req.body;

    const user = await User.findOne({ loginId });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);

    // Role-based redirection URLs
    const roleRedirects = {
      "CM": "https://centre.example.com",
      "ARM": "https://area.example.com",
      "Vision": "https://vision.example.com",
      "ID": "https://id.example.com",
      "Admin": "https://admin.example.com"
    };

    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      role: user.role, 
      redirectUrl: roleRedirects[user.role] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

