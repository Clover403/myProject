# 🛡️ CloverGuard - Advanced Security Platform

**Version 2.1.0** | **February 2026** | **Database: PostgreSQL Local**

CloverGuard adalah platform keamanan siber terdepan yang menggabungkan scanning otomatis, marketplace ethical hacker, dan AI security assistant untuk memberikan perlindungan menyeluruh bagi aplikasi web Anda.

## ✨ Fitur Utama

### 🔍 Security Scanning
- **VirusTotal Integration**: URL reputation scanning dengan 70+ vendor keamanan
- **OWASP ZAP** (Coming Soon): Active vulnerability scanning 
- **Daily Limits**: 5 scans per hari per user untuk optimasi resource
- **Real-time Progress**: Live scanning progress dengan WebSocket updates
- **Scan History**: Riwayat lengkap dengan filtering dan search

### 🤖 AI Security Assistant
- **Gemini-Powered**: Penjelasan vulnerability dengan Google Gemini AI
- **Token Limits**: 2000 token per hari per user  
- **Vulnerability Analysis**: AI-generated remediation steps
- **Security Advice**: Personalized recommendations based on scan results
- **Interactive Chat**: Diskusi real-time tentang security findings

### 🛒 Marketplace Ethical Hacker
- **Product Management**: Ethical hacker dapat menjual layanan security
- **Order System**: Complete order lifecycle management
- **Midtrans Integration**: Payment gateway dengan sandbox support
- **Real-time Chat**: Komunikasi buyer-seller via Socket.io
- **Role-based Access**: User, Ethical Hacker, Admin permissions

## 🚀 Technology Stack

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (Local Database)
- **Sequelize ORM** dengan migration system
- **Passport.js** untuk Google OAuth
- **Socket.io** untuk real-time features
- **JWT** untuk authentication
- **Google Gemini AI** untuk AI features
- **Midtrans** untuk payment processing

### Frontend  
- **React 18** dengan **Vite**
- **Tailwind CSS** untuk styling
- **Redux Toolkit** untuk state management
- **React Router** untuk navigation
- **Axios** untuk API calls
- **Socket.io Client** untuk real-time updates

### Database Schema
- **Users**: Authentication & role management
- **Scans**: Security scan records dengan VirusTotal data
- **Targets**: Saved scan targets
- **Vulnerabilities**: Detailed vulnerability findings
- **AIExplanations**: AI-generated explanations
- **Products**: Marketplace items dari ethical hackers
- **Orders**: Complete order lifecycle
- **Conversations & Messages**: Real-time chat system

## 🔧 Setup & Installation

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** 12+
- **npm** atau **yarn**

### Database Setup
```bash
# Create database user
sudo -u postgres psql -c "CREATE USER clover_user WITH PASSWORD 'clover123';"
sudo -u postgres psql -c "CREATE DATABASE cloverguard_local OWNER clover_user;"
```

### Backend Setup
```bash
cd backend/
npm install
cp .env.example .env  # Configure your environment variables
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

### Frontend Setup  
```bash
cd frontend/
npm install
npm run dev
```

## 🌍 Environment Variables

```env
# Database
DATABASE_URL=postgres://clover_user:clover123@localhost:5432/cloverguard_local

# Authentication
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret

# AI Services
GEMINI_API_KEY=your-gemini-api-key
VT_API_KEY=your-virustotal-api-key

# Payment (Sandbox)
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

# ZAP Integration (Future)
ZAP_API_URL=http://localhost:8080
ZAP_API_KEY=your-zap-api-key
```

## 📊 API Endpoints

### Authentication
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/verify-token` - Token verification
- `GET /api/auth/me` - Current user profile

### Scans
- `POST /api/scans` - Start new security scan
- `GET /api/scans` - List user's scans
- `GET /api/scans/usage` - Daily scan usage
- `GET /api/scans/:id` - Scan details
- `DELETE /api/scans/:id` - Delete scan

### AI Assistant
- `POST /ai/explain/:vulnerabilityId` - Get AI explanation
- `POST /ai/chat` - Chat with AI assistant
- `GET /ai/usage` - Daily token usage

### Marketplace
- `GET /api/products` - List all products
- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - User's purchases
- `POST /api/orders/:id/pay` - Initiate payment

### Chat
- `GET /api/chat/conversations` - User conversations
- `POST /api/chat/messages` - Send message
- WebSocket events for real-time chat

## 🔐 Security Features

### Rate Limiting
- **Scans**: 5 per day per user
- **AI Requests**: 20 per minute + 2000 tokens per day
- **API**: Standard rate limiting per endpoint

### Data Protection
- **JWT** tokens untuk secure authentication
- **Password hashing** dengan bcrypt
- **SQL Injection** protection via Sequelize ORM
- **CORS** configuration untuk frontend security
- **Environment variables** untuk sensitive data

### Database Security
- **Dedicated database user** dengan limited privileges
- **Foreign key constraints** untuk data integrity
- **Transaction support** untuk atomic operations
- **Migration system** untuk safe schema changes

## 📈 Performance Features

- **Connection pooling** untuk database
- **Real-time updates** dengan WebSocket
- **Background job processing** untuk scans
- **Efficient query optimization**
- **Client-side caching** dengan React Query
- **Code splitting** untuk faster loads

## 🧪 Development Mode

### Demo Limitations
- **OWASP ZAP**: Temporarily disabled untuk efisiensi
- **VirusTotal Only**: Scanning menggunakan VirusTotal API
- **Sandbox Payments**: Midtrans dalam mode sandbox
- **Local Database**: PostgreSQL lokal untuk development

### Testing
```bash
# Backend tests
cd backend/
npm test

# Frontend build test
cd frontend/  
npm run build
```

## 🚀 Production Deployment

### Database Migration
```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production database URL
- Enable `MIDTRANS_IS_PRODUCTION=true`
- Configure production domain URLs
- Set secure JWT secrets

### Performance
- Enable database SSL dalam production
- Configure load balancing
- Set up Redis untuk session store
- Enable compression middleware
- Configure CDN untuk static assets

## 📝 Changelog

### v2.1.0 (February 2026)
- ✅ **Local PostgreSQL**: Migration dari Supabase ke database lokal
- ✅ **Column Fix**: Resolved `virustotalMaliciousCount` column issues
- ✅ **Enhanced Security**: Improved rate limiting dan validation
- ✅ **Demo Mode**: OWASP ZAP disabled untuk efisiensi
- ✅ **Documentation**: Updated semua MD files dengan versi terbaru

### v2.0.0 (January 2026)
- ✅ **Marketplace**: Ethical hacker marketplace integration
- ✅ **Real-time Chat**: Socket.io implementation
- ✅ **Payment Gateway**: Midtrans integration
- ✅ **AI Assistant**: Google Gemini integration
- ✅ **Enhanced UI**: Modern React + Tailwind design

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🆘 Support

- **Documentation**: Check files `*_SETUP.md`
- **Issues**: Open GitHub issue
- **Email**: support@cloverguard.com

---

**Made with ❤️ by CloverGuard Team** | **Securing the Digital World, One Scan at a Time** 🛡️