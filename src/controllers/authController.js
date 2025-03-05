const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// Function to generate a random 4-digit PIN
const generateRandomPIN = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Function to generate loginId based on role
const generateLoginId = async (role) => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  const loginId = `${role}${randomNumber}`;

  // Ensure uniqueness
  const existingUser = await User.findOne({ loginId });
  if (existingUser) return generateLoginId(role);

  return loginId;
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { role, branchId, centreId, regionId, name, mobileNumber, email, status } = req.body;

    if (!role || !branchId || !centreId || !regionId || !name || !mobileNumber || !email || !status) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["CM", "ARM", "Vision", "ID", "Admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const loginId = await generateLoginId(role);
    const pin = generateRandomPIN();
    const hashedPin = await bcrypt.hash(pin, 10);

    const user = new User({
      loginId,
      pin: hashedPin,
      role,
      branchId,
      centreId,
      regionId,
      name,
      mobileNumber,
      email,
      status
    });

    await user.save();

    res.status(201).json({ 
      message: "User registered successfully",
      loginId, 
      pin // Send the generated PIN for first-time login
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};


// ✅ Login user
exports.login = async (req, res) => {
  try {
    const { loginId, pin } = req.body;

    const user = await User.findOne({ loginId });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);

    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
