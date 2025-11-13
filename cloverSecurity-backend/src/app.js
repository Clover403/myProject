const express = require('express');
const cors = require('cors');
const session = require('express-session');

// Load environment variables FIRST
require('dotenv').config();

const passport = require('./config/passport.config');

// Import routes
const scanRoutes = require('./routes/scan.routes');
const targetRoutes = require('./routes/target.routes');
const aiRoutes = require('./routes/ai.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SecureCheck API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

module.exports = app;