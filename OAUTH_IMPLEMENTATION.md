# CloverSecurity - OAuth Implementation Guide

## ✅ Sudah Ditambahkan

### Backend (Express)
- ✅ Passport.js dengan Google OAuth 2.0 strategy
- ✅ Session management dengan express-session
- ✅ User model dengan Sequelize
- ✅ Auth controller untuk Google OAuth flow
- ✅ Auth routes (`/api/auth/google`, `/api/auth/google/callback`, dll)
- ✅ JWT token generation & verification
- ✅ Updated app.js dengan middleware Passport

### Frontend (React)
- ✅ Redux store dengan Redux Toolkit
- ✅ Auth slice untuk state management
- ✅ Login page dengan Google OAuth button
- ✅ Protected routes dengan automatic authentication check
- ✅ useAuth custom hook
- ✅ Updated Navbar component dengan user info & logout
- ✅ API interceptor untuk automatic JWT token attachment

### Struktur Files Baru

**Backend:**
```
cloverSecurity-backend/
├── src/
│   ├── controllers/
│   │   └── authController.js          (NEW)
│   ├── routes/
│   │   └── auth.routes.js             (NEW)
│   ├── config/
│   │   └── passport.config.js         (NEW)
│   └── app.js                          (UPDATED)
├── models/
│   └── user.js                         (UPDATED)
├── migrations/
│   └── 20251112000001-create-user.js  (NEW)
├── package.json                        (UPDATED)
└── .env.example                        (NEW)
```

**Frontend:**
```
cloversecurity-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx                   (NEW)
│   │   ├── Dashboard.jsx               (UPDATED)
│   │   └── Targets.jsx                 (UPDATED)
│   ├── components/
│   │   └── Navbar.jsx                  (UPDATED)
│   ├── hooks/
│   │   └── useAuth.js                  (UPDATED)
│   ├── redux/
│   │   ├── store.js                    (UPDATED)
│   │   └── authSlice.js                (UPDATED)
│   ├── services/
│   │   └── api.jsx                     (UPDATED)
│   ├── App.jsx                         (UPDATED)
│   ├── main.jsx                        (UPDATED)
│   └── package.json                    (UPDATED)
└── .env.example                        (RECOMMENDED)
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd cloverSecurity-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan credentials Google OAuth Anda
```

**Environment Variables yang diperlukan:**
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

```bash
# Run migrations
npm run db:migrate

# Start server
npm run dev
```

### 2. Frontend Setup

```bash
cd cloversecurity-frontend

# Install dependencies
npm install

# Setup environment variables (optional)
# Create .env.local file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env.local

# Start dev server
npm run dev
```

## 🔐 Google OAuth Setup (Google Cloud Console)

1. **Buat Project**
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project

2. **Enable Google+ API**
   - APIs & Services → Library
   - Search "Google+ API"
   - Click Enable

3. **Create OAuth Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth Client ID
   - Application type: Web application
   
4. **Configure URIs**
   - Authorized JavaScript origins:
     ```
     http://localhost:5000
     http://localhost:5173
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5000/api/auth/google/callback
     ```

5. **Copy Credentials**
   - Save Client ID dan Client Secret ke .env file

## 📱 User Flow

```
User → Click "Sign in with Google"
  ↓
Browser redirects to /api/auth/google
  ↓
Passport redirects ke Google login
  ↓
User logs in dengan Google account
  ↓
Google redirects ke /api/auth/google/callback
  ↓
Backend verifies token & creates/updates user
  ↓
Backend generates JWT token
  ↓
Backend redirects ke frontend dengan token di URL
  ↓
Frontend saves token & redirects ke dashboard
  ↓
User dapat akses protected pages
```

## 🛠️ API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback (automatically handled)
- `POST /api/auth/verify-token` - Verify JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### All Other Endpoints
- Automatically include JWT token di header
- Token interceptor di `src/services/api.jsx`

## 📊 Redux Store Structure

```javascript
{
  auth: {
    user: {
      id: number,
      email: string,
      name: string,
      picture: string (url),
      googleId: string
    },
    token: string (JWT),
    isAuthenticated: boolean,
    loading: boolean,
    error: null | string
  }
}
```

## 🔑 Key Features

1. **Automatic Token Management**
   - Token stored di localStorage
   - Auto-verify on app load
   - Auto-refresh dari API

2. **Protected Routes**
   - Semua routes kecuali `/login` protected
   - Redirect ke login jika belum authenticated

3. **User Session**
   - Simpan di database
   - Track last login
   - User profile dengan picture

4. **Security**
   - JWT token expiry (7 days)
   - Secure cookies (httpOnly, sameSite)
   - CORS configuration

## ⚙️ Configuration

### .env Backend
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloversecurity
DB_USER=postgres
DB_PASSWORD=your_password

FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### .env Frontend (Optional)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📝 Troubleshooting

### "Cannot find module 'passport'"
```bash
npm install
```

### CORS Error
- Check `FRONTEND_URL` di backend .env
- Check CORS origin di `src/app.js`

### Token Invalid
- Pastikan `JWT_SECRET` sama di backend
- Check token expiry time

### Google OAuth Redirect Error
- Verify URIs di Google Cloud Console
- Check untuk typos & trailing slashes

### Database Migration Error
```bash
npm run db:migrate:undo
npm run db:migrate
```

## 🎯 Next Steps

1. Setup Google Cloud credentials ✅ (NEEDED)
2. Install dependencies ✅ 
3. Configure .env ✅ (NEEDED)
4. Run migrations ✅ (NEEDED)
5. Start both servers ✅ (NEEDED)
6. Test login flow
7. Deploy ke production

## 📚 Useful Commands

```bash
# Backend
npm run dev              # Start dev server dengan nodemon
npm run start           # Start production server
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database

# Frontend
npm run dev             # Start dev server
npm run build           # Build untuk production
npm run preview         # Preview production build
```

## 🔒 Security Notes

⚠️ **PRODUCTION CHECKLIST:**
- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` ke random string yang kuat
- [ ] Change `SESSION_SECRET` ke random string yang kuat
- [ ] Enable HTTPS
- [ ] Set `secure: true` di cookie configuration
- [ ] Update `FRONTEND_URL` dengan domain production
- [ ] Update Google OAuth URIs dengan domain production
- [ ] Setup environment variables di production server
- [ ] Enable database backups
- [ ] Setup monitoring & logging

## 📞 Support

Untuk masalah atau pertanyaan:
1. Check error messages di console
2. Review logs di backend
3. Check Google Cloud Console settings
4. Refer to documentation links

---

Happy coding! 🚀
