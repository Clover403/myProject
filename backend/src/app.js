const express = require('express');
const cors = require('cors');
const session = require('express-session');

// Load environment variables FIRST
require('dotenv').config();

console.log('🚀 Starting SecureCheck API...');
console.log('📝 Environment:', process.env.NODE_ENV || 'development');
console.log('📝 Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
console.log('📝 Port:', process.env.PORT || 5000);



const passport = require('./config/passport.config');

// Import routes
const scanRoutes = require('./routes/scan.routes');
const targetRoutes = require('./routes/target.routes');
const aiRoutes = require('./routes/ai.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use((req, res, next) => {
  console.log('🧭 Request masuk:', req.method, req.url);
  next();
});
// CORS Configuration - VERY PERMISSIVE FOR DEBUGGING
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('⚠️ CORS: Unknown origin:', origin);
      callback(null, true); // Allow anyway for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  console.log('💓 Health check requested');
  
  res.json({ 
    status: 'OK', 
    message: 'SecureCheck API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route (ensure proper response for http://localhost:5000) //unutk ngecek
app.get('/', (req, res) => {
  res.send(`
    <h2>✅ SecureCheck Backend is Running</h2>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}</p>
    <p>Available endpoints:</p>
    <ul>
      <li>GET /health</li>
      <li>POST /api/scans</li>
      <li>GET /api/scans</li>
      <li>POST /api/targets</li>
      <li>POST /api/ai/explain/:vulnerabilityId</li>
    </ul>
  `);
});



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

console.log('✅ Express app configured');

module.exports = app;