const jwt = require('jsonwebtoken');

const masterAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Double check that this token is for our master admin
      if (decoded.username === process.env.LOGIN_API_USERNAME) {
        req.user = decoded;
        return next();
      }

      return res.status(403).json({ message: 'Not authorized as Master Admin' });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = masterAdminAuth;
