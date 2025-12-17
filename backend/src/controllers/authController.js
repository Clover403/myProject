const db = require('../../models');
const User = db.User;

// Google OAuth Callback
const bcrypt = require('bcryptjs');

// Register with Email/Password
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Password Validation
    // Length >= 6, and must contain letters, numbers, and special characters
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long and contain alphabets, numbers, and special characters.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // If user exists but only has Google login (no password)
      if (!existingUser.password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await existingUser.update({ password: hashedPassword, name }); // Update name possibly? Or keep existing.
        
        // Generate Token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: existingUser.id, email: existingUser.email },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        return res.status(200).json({
           success: true,
           message: 'Account updated with password',
           token,
           user: {
             id: existingUser.id,
             email: existingUser.email,
             name: existingUser.name,
             picture: existingUser.picture
           }
        });
      }
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      // Default picture or null
    });

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        picture: newUser.picture
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login with Email/Password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    if (!user.password) {
      return res.status(401).json({ error: 'Please login with verify method used to create account (e.g. Google)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login
    await user.update({ lastLogin: new Date() });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        googleId: user.googleId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

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
