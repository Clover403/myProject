# Code Snippets & Examples

## Backend Examples

### 1. Menggunakan useAuth Hook di Frontend
```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login first</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <img src={user.picture} alt={user.name} />
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 2. Call Protected API Endpoint
```javascript
// api.jsx sudah handle token automatically
import { scanAPI } from '../services/api';

async function fetchScans() {
  try {
    const response = await scanAPI.getAllScans();
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Token automatically ditambahkan di header:
// Authorization: Bearer {token}
```

### 3. Redirect Based on Auth Status
```javascript
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function AdminPage() {
  const { isAuthenticated } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Admin Content</div>;
}
```

### 4. Display User Info
```javascript
import { useAuth } from '../hooks/useAuth';

function UserProfile() {
  const { user } = useAuth();

  return (
    <div className="profile">
      {user?.picture && (
        <img src={user.picture} alt="Profile" className="avatar" />
      )}
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      <p>Provider: Google</p>
    </div>
  );
}
```

### 5. Dispatch Redux Action Manually
```javascript
import { useDispatch, useSelector } from 'react-redux';
import { logout, verifyToken } from '../redux/authSlice';

function Settings() {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleVerify = async () => {
    const token = localStorage.getItem('authToken');
    await dispatch(verifyToken(token));
  };

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleVerify}>Verify Token</button>
    </div>
  );
}
```

## Backend API Calls

### 1. Manual JWT Verification (Backend)
```javascript
// Di auth controller
const jwt = require('jsonwebtoken');

function verifyTokenManual(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // { id, email, iat, exp }
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 2. Generate New Token (Backend)
```javascript
// Di auth controller
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

### 3. Access User di Protected Endpoint
```javascript
// Contoh di scan controller
async function startScan(req, res) {
  try {
    // User tersedia di req.user karena Passport middleware
    const userId = req.user.id;
    
    const scan = await db.Scan.create({
      url: req.body.url,
      userId: userId,
      // ... other fields
    });

    res.json({ success: true, scan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 4. Create Middleware untuk Protected Routes
```javascript
// middleware/auth.js
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Usage di routes
router.post('/scan', authMiddleware, scanController.startScan);
```

## Redux Examples

### 1. Access Redux State
```javascript
import { useSelector } from 'react-redux';

function Dashboard() {
  const { user, token, isAuthenticated, loading } = useSelector(
    state => state.auth
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p>User: {user?.name}</p>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 2. Dispatch Multiple Actions
```javascript
import { useDispatch } from 'react-redux';
import { verifyToken, setUser, setToken } from '../redux/authSlice';

function LoginHandler() {
  const dispatch = useDispatch();

  async function handleLogin(token) {
    // Save token
    dispatch(setToken(token));

    // Verify & fetch user
    const result = await dispatch(verifyToken(token));

    if (result.payload) {
      console.log('Login successful:', result.payload);
    }
  }

  return <button onClick={() => handleLogin(tokenFromGoogle)}>
    Login
  </button>;
}
```

### 3. Redux DevTools Debugging
```
// Install Redux DevTools Extension di Chrome
// Buka http://localhost:5173
// Open DevTools → Redux tab
// Lihat state changes & action history
// Time-travel debugging enabled
```

## Protected Component Examples

### 1. Protected Page
```javascript
// pages/admin/AdminPage.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function AdminPage() {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <div>Admin Panel</div>;
}
```

### 2. Login Required Component
```javascript
// components/LoginRequired.jsx
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

function LoginRequired() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="alert">
        <p>Please <Link to="/login">login</Link> to continue</p>
      </div>
    );
  }

  return null;
}
```

### 3. Loading State Handler
```javascript
import { useSelector } from 'react-redux';

function DataFetch() {
  const { loading, error } = useSelector(state => state.auth);

  if (loading) {
    return <div className="spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return <div>Content loaded</div>;
}
```

## API Call Examples

### 1. Create New Scan dengan Auth
```javascript
import { scanAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function CreateScan() {
  const { token } = useAuth();

  async function handleScan(url) {
    try {
      // Token automatically attached
      const response = await scanAPI.startScan({
        url: url,
        scanType: 'full'
      });

      console.log('Scan created:', response.data);
    } catch (error) {
      console.error('Error:', error.response?.data);
    }
  }

  return (
    <input 
      type="url" 
      placeholder="Enter URL"
      onBlur={(e) => handleScan(e.target.value)}
    />
  );
}
```

### 2. Logout Handler
```javascript
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

function LogoutButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return <button onClick={handleLogout}>Logout</button>;
}
```

### 3. Error Handling
```javascript
import { useSelector } from 'react-redux';

function AuthError() {
  const { error } = useSelector(state => state.auth);

  if (!error) return null;

  return (
    <div className="alert alert-danger">
      <p>Error: {error}</p>
      <button onClick={() => dispatch(clearError())}>
        Dismiss
      </button>
    </div>
  );
}
```

## Environment Setup

### .env Backend
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloversecurity
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-from-google-cloud
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-cloud
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# APIs
GEMINI_API_KEY=your-gemini-key
ZAP_API_KEY=your-zap-key
```

### .env Frontend (Optional)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CloverSecurity
```

## Debugging Tips

### 1. Check Token di Browser
```javascript
// Console
localStorage.getItem('authToken')
// Output: eyJhbGciOiJIUzI1NiIs...
```

### 2. Decode JWT Token
```javascript
function decodeToken(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// Usage
const decoded = decodeToken(localStorage.getItem('authToken'));
console.log(decoded); // { id: 1, email: "...", iat: ..., exp: ... }
```

### 3. Check Redux State
```javascript
// In console
// Redux DevTools → Dispatch action to inspect state
store.getState(); // Whole state
store.getState().auth; // Auth state only
```

### 4. Network Request Monitoring
```javascript
// DevTools → Network tab
// Filter by XHR
// Click request → Headers
// Check Authorization header
// Check response status
```

## Common Patterns

### 1. Redirect After Login
```javascript
function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      dispatch(setToken(token));
      navigate('/'); // Redirect ke dashboard
    }
  }, []);
}
```

### 2. Prevent Unauthorized Access
```javascript
function Dashboard() {
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated]);
}
```

### 3. Load User Data on App Start
```javascript
function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(verifyToken(token));
    }
  }, []);
}
```

---

**These examples cover the most common use cases for the OAuth implementation.**
**Refer back to these when you need to integrate auth in new components or pages.**
