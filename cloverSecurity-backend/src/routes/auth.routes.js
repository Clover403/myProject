const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Google OAuth login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback - FIXED VERSION
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`,
    session: false  // Disable session since we're using JWT
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_user`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email,
          name: req.user.name 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Update last login
      await req.user.update({ lastLogin: new Date() });

      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // PENTING: Redirect ke route khusus untuk handle OAuth callback
      res.redirect(`${frontendURL}/auth/callback?token=${token}`);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { User } = require('../../models');
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
    console.error('Get current user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Verify token
router.post('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { User } = require('../../models');
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
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;