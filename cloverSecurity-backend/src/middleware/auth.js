const jwt = require('jsonwebtoken');
const { User } = require('../../models');

// Authentication middleware to check if user is logged in
// Supports both session-based (Passport) and JWT token-based authentication
// src/middleware/auth.js - pastikan seperti ini
const requireAuth = async (req, res, next) => {
  try {
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Check JWT token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
module.exports = {
  requireAuth
};
