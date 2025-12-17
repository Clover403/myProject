const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

// Email/Password Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth login
router.get('/google', 
  (req, res, next) => {
    console.log('🚀 Starting Google OAuth login...');
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Google OAuth callback - SUPER FIXED VERSION
router.get('/google/callback',
  (req, res, next) => {
    console.log('📥 Received OAuth callback from Google');
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`,
    session: false
  }),
  async (req, res) => {
    try {
      console.log('✅ Passport authentication successful');
      
      if (!req.user) {
        console.error('❌ No user object in request');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_user`);
      }

      console.log('👤 User authenticated:', {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      });

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

      console.log('🔑 JWT token generated');

      // Update last login
      await req.user.update({ lastLogin: new Date() });

      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectURL = `${frontendURL}/auth/callback?token=${token}`;
      
      console.log('🔀 Redirecting to:', redirectURL);
      
      // CRITICAL: Use 302 redirect
      res.redirect(redirectURL);
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token in /me request');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔍 Verifying token for /me endpoint');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { User } = require('../../models');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.email);
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
    console.error('❌ /me endpoint error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Verify token
router.post('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token in verify request');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { User } = require('../../models');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('✅ Token verified for user:', user.email);
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
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    console.log('👋 User logged out');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;