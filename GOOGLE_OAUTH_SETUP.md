# Google OAuth Setup Guide

## Overview
CloverSecurity kini mendukung login dengan Google OAuth 2.0. Panduan ini akan membantu Anda mengatur Google OAuth untuk project.

## Step 1: Setup Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Aktifkan Google+ API:
   - Di sidebar, klik "APIs & Services"
   - Klik "Enable APIs and Services"
   - Cari "Google+ API"
   - Klik "ENABLE"

## Step 2: Buat OAuth Credentials

1. Di Google Cloud Console, buka "APIs & Services" → "Credentials"
2. Klik "Create Credentials" → "OAuth Client ID"
3. Pilih "Web application"
4. Isi form:
   - **Name**: CloverSecurity
   - **Authorized JavaScript origins**:
     - `http://localhost:5000`
     - `http://localhost:5173`
     - `https://yourdomain.com` (untuk production)
   
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback`
     - `https://yourdomain.com/api/auth/google/callback` (untuk production)

5. Klik "Create"
6. Copy `Client ID` dan `Client Secret`

## Step 3: Update .env File

Backend (.env):
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here
```

Frontend (.env):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Step 4: Install Dependencies

**Backend**:
```bash
cd cloverSecurity-backend
npm install
```

**Frontend**:
```bash
cd cloversecurity-frontend
npm install
```

## Step 5: Database Migration

```bash
cd cloverSecurity-backend
npm run db:migrate
```

## Step 6: Run the Application

**Backend**:
```bash
cd cloverSecurity-backend
npm run dev
```

**Frontend** (di terminal baru):
```bash
cd cloversecurity-frontend
npm run dev
```

## Features

### Backend (Express + Passport)
- ✅ Google OAuth 2.0 authentication dengan Passport.js
- ✅ JWT token generation untuk API access
- ✅ User session management
- ✅ Protected routes dengan authentication
- ✅ User model di database

### Frontend (React + Redux)
- ✅ Redux store untuk state management
- ✅ Auth slice untuk authentication state
- ✅ Protected routes dengan React Router
- ✅ Login page dengan Google OAuth button
- ✅ Token persistence di localStorage
- ✅ Automatic token verification on app load

## API Endpoints

### Authentication Endpoints
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/verify-token` - Verify JWT token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

## User Flow

1. User klik "Sign in with Google" di Login page
2. Browser redirect ke `/api/auth/google`
3. User di-redirect ke Google login
4. Setelah login berhasil, Google redirect ke `/api/auth/google/callback`
5. Backend verify Google token dan create/update user di database
6. Backend generate JWT token dan redirect ke frontend dengan token di URL
7. Frontend save token di localStorage dan redirect ke dashboard
8. User dapat akses protected routes dengan JWT token

## Security Notes

⚠️ **IMPORTANT**:
1. Jangan share `GOOGLE_CLIENT_SECRET` di public repository
2. Gunakan environment variables untuk sensitive data
3. Ubah `JWT_SECRET` dan `SESSION_SECRET` untuk production
4. Set `NODE_ENV=production` untuk production deployment
5. Enable HTTPS di production
6. Set cookie `secure: true` di production

## Troubleshooting

### "Invalid redirect URI"
- Pastikan redirect URI di Google Console match dengan backend URL
- Check spelling dan trailing slashes

### "Cannot find module 'passport'"
- Run `npm install` di backend folder

### "Token verification failed"
- Pastikan JWT_SECRET sama di backend
- Check token expiry time

### CORS errors
- Pastikan FRONTEND_URL di .env match dengan frontend URL
- Check CORS origin di app.js

## Integration dengan Backend API

Semua request ke API endpoints (scans, targets, ai) otomatis include JWT token di header:

```javascript
// Di api.jsx, interceptor otomatis add token:
config.headers.Authorization = `Bearer ${token}`;
```

## Redux Store Structure

```javascript
auth: {
  user: { id, email, name, picture, googleId },
  token: "jwt-token",
  isAuthenticated: boolean,
  loading: boolean,
  error: null
}
```

## Next Steps

1. Setup Google Cloud credentials
2. Update .env files
3. Install dependencies
4. Run migrations
5. Start backend dan frontend
6. Test login flow

Happy coding! 🚀
