const jwt = require('jsonwebtoken');
const { User } = require('../../models');

// Authentication middleware to check if user is logged in
// Supports both session-based (Passport) and JWT token-based authentication
const requireAuth = async (req, res, next) => {
  try {
    // Skip auth check for OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Check session first (Passport session auth)
    if (req.user) {
      return next();
    }

    // Check JWT token in Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request object
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
