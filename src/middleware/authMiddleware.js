const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  try {
    // Ensure token starts with 'Bearer '
    if (token.startsWith('Bearer ')) {
      token = token.split(' ')[1]; // Extract only the token part
    } else {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-pin');

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// ✅ Fix: Ensure this function is properly exported
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
//     next();
//   };
// };

// ✅ Export both protect & authorize functions
module.exports = { protect};
