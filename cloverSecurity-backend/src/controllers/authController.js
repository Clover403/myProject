const db = require('../../models');
const User = db.User;

// Google OAuth Callback
exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login
    await req.user.update({ lastLogin: new Date() });

    // Return token and user data
    res.json({
      success: true,
      token,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        googleId: req.user.googleId
      }
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        googleId: req.user.googleId
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        googleId: user.googleId
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
