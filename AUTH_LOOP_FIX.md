# Login & Auth Flow - Debugging Guide

## Problem
Infinite loop/spinning when logging in and on refresh.

## Root Causes Fixed

### 1. **Infinite Redirect Loop**
- App.jsx verifyToken was called repeatedly without tracking state
- Login checks isAuthenticated → redirects to home
- Home checks isAuthenticated → ProtectedRoute loads
- App.jsx verifyToken called again → loop

**Fix**: Added `verificationAttempted` state with useRef in App.jsx
- Only verify token ONCE
- Track that verification already attempted
- Prevent multiple dispatch calls

### 2. **AuthCallback Race Condition**
- useEffect in AuthCallback could run multiple times
- Multiple dispatch(verifyToken) calls at once
- React StrictMode runs effects twice in dev

**Fix**: Added `callbackProcessed` useRef in AuthCallback
- Prevent callback from running twice
- Process OAuth token only once

### 3. **Loading State Not Checked**
- Login component redirected immediately without checking loading
- Could cause redirect while verification in progress

**Fix**: Check `loading` state in dependency array
- Wait for verification to complete
- Then redirect if authenticated

## New Auth Flow

```
User Login
    ↓
Click "Login with Google"
    ↓
OAuth Redirect to Backend
    ↓
Backend validates & creates JWT token
    ↓
Redirect to frontend: /auth/callback?token=xxx
    ↓
AuthCallback Component (runs ONCE now!)
    - Get token from URL
    - Save to localStorage
    - Dispatch setToken (updates Redux)
    - Dispatch verifyToken (get user data)
    - Redirect to Dashboard
    ↓
App.jsx checks token on mount (runs ONCE!)
    - If stored token exists
    - AND no user data yet
    - AND not loading
    - THEN verify token
    ↓
Dashboard Loads
    - All API calls include Bearer token
    - Auth middleware verifies JWT
    - userId captured in requests
```

## Testing Steps

### Test 1: Fresh Login
```bash
1. Open Browser DevTools (F12)
2. Console → localStorage.clear()
3. Close Developer Tools
4. Go to http://localhost:5173/login
5. Click "Login with Google"
6. Complete OAuth
7. Should see spinning loader briefly
8. Should redirect to Dashboard (no more spinning)
9. Check Console: should see "🔍 Verifying stored token..." once
10. Dashboard loads with stats & scans
```

### Test 2: Refresh Page (Token Exists)
```bash
1. After successful login, you're in Dashboard
2. Press F5 (refresh page)
3. App.jsx runs verification check
4. Should verify token from localStorage
5. Redirect to Dashboard (no login page)
6. Should NOT be stuck spinning
```

### Test 3: Invalid/Expired Token
```bash
1. In Browser Console: 
   localStorage.setItem('authToken', 'invalid-token-xxx')
2. Refresh page
3. verifyToken fails
4. Should redirect to Login page
5. localStorage token cleared
6. Not stuck spinning
```

### Test 4: Add Target (Uses userId)
```bash
1. Login successfully
2. Go to Dashboard
3. Click "Add Target"
4. Fill form:
   - URL: http://www.vulnweb.com/
   - Name: test target
   - Tags: web
5. Click "Add Target"
6. Should create successfully
7. Check Backend Console: should log userId
```

### Test 5: Start Scan (Uses userId)
```bash
1. Go to Dashboard → "Create New Scan"
2. Or go to Targets → Start Scan
3. Fill URL: http://example.com
4. Click "Start Security Scan"
5. Should redirect to Scan Detail page
6. NOT 401 Unauthorized
7. Check Backend: should show scan created with userId
```

## Key Files Changed

1. **src/App.jsx**
   - Added useState for verificationAttempted
   - Fixed dependency array
   - Check loading state

2. **src/pages/AuthCallback.jsx**
   - Added useRef to prevent double execution
   - Prevent multiple verifyToken calls

3. **src/pages/Login.jsx**
   - Check loading state before redirect
   - Don't redirect while still verifying

## Debugging Commands

```bash
# Check if token in localStorage
Browser Console: 
> localStorage.getItem('authToken')

# Check Redux state
Browser Console (if Redux DevTools):
> $r (select component in React DevTools)

# Check backend logs
Terminal: tail -f backend.log

# Test API endpoint directly
curl -s http://localhost:5000/health | jq

# Test verify-token endpoint
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/verify-token | jq
```

## Expected Behavior After Fix

✅ Login → OAuth → Callback → Dashboard (no spinning)
✅ Refresh → Check token → Dashboard (no login redirect)
✅ Add Target → Creates with userId
✅ Start Scan → Creates with userId
✅ All API calls use Bearer token
✅ Backend auth middleware verifies JWT

## If Still Having Issues

1. **Check Backend is Running**
   ```bash
   ps aux | grep "npm run dev" | grep -v grep
   ```

2. **Check Frontend is Updated**
   ```bash
   # In VS Code: Ctrl+Shift+P → Developer: Reload Window
   # Or: npm run dev (restart frontend dev server)
   ```

3. **Clear All Storage**
   ```bash
   localStorage.clear()
   sessionStorage.clear()
   # Close browser completely
   # Reopen
   ```

4. **Check Console for Errors**
   - Browser Console (F12)
   - Backend terminal output
   - Look for red error messages

5. **Network Tab Debugging**
   - Open DevTools → Network tab
   - Try login again
   - Check all XHR/fetch requests
   - Look for 401/500 responses
   - Click request → Response tab for error details
