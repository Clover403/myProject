# 🔒 ZAP (Zed Attack Proxy) Setup Guide

## Informasi Penting
- **ZAP sekarang wajib berjalan** untuk setiap scan. Backend tidak lagi menggunakan mock vulnerabilities.
- Jika ZAP tidak tersedia, permintaan scan akan gagal dengan pesan error agar kamu tahu daemon belum aktif.
- Pastikan API key di `.env` sama dengan konfigurasi saat menjalankan daemon.

## Install & Jalankan ZAP

### A. Install ZAP di MacOS
```bash
brew install zaproxy
```

### B. Install ZAP di Linux
```bash
# Ubuntu/Debian
sudo apt-get install zaproxy

# Atau download dari: https://www.zaproxy.org/download/
```

Pastikan Java 17 atau lebih baru sudah ter-install:

```bash
sudo apt-get install openjdk-21-jre-headless
```

### C. Install ZAP di Windows
- Download dari: https://www.zaproxy.org/download/
- Jalankan installer

### D. Jalankan ZAP Headless Mode (untuk background)
```bash
# MacOS (Homebrew)
zaproxy -cmd -port 8080 -config api.key=your-api-key

# Windows
"C:\Program Files\OWASP ZAP\zaproxy.exe" -cmd -port 8080

# Linux (arsip ZIP offici al)
/path/to/zap.sh -daemon -silent -host 127.0.0.1 -port 8080 \
   -config api.key=your-api-key \
   -config api.addrs.addr.name=.* \
   -config api.addrs.addr.regex=true

# Jalankan sebagai service background di Linux
nohup /path/to/zap.sh -daemon -silent -host 127.0.0.1 -port 8080 \
   -config api.key=your-api-key \
   -config api.addrs.addr.name=.* \
   -config api.addrs.addr.regex=true \
   > /tmp/zap-daemon.log 2>&1 &
```

Atau dengan Docker:
```bash
docker run -p 8080:8080 owasp/zap2docker-stable:latest zap-baseline.py -t http://example.com
```

### E. Konfigurasi Backend untuk ZAP
Edit `.env` di backend:
```
ZAP_API_URL=http://localhost:8080
ZAP_API_KEY=your-api-key-here
```

## Status Aplikasi Sekarang

✅ **Backend Real Scan**: Menggunakan OWASP ZAP API
✅ **Database**: Menyimpan semua scan data
✅ **Frontend**: Menampilkan results dengan benar
✅ **Error Handling**: Memberikan pesan ketika ZAP belum siap

## Troubleshooting

### Error: "Request failed with status code 500"
1. **Check backend logs** untuk melihat error detail
2. **Pastikan database running** - `psql -U postgres`
3. **Pastikan userId tidak null** - Check auth middleware

### Scan stuck di "pending"
1. Pastikan daemon ZAP berjalan dan dapat diakses (`curl http://127.0.0.1:8080/JSON/core/view/version/?apikey=...`)
2. Periksa apakah target dapat diakses dari mesin ini (tidak diblokir firewall)
3. Cek log backend untuk melihat error lengkap (time-out spider/active scan)

### Vulnerabilities tidak muncul
1. Refresh page atau navigate ke ScanDetail
2. Check browser console untuk network errors
3. Check backend logs

## Testing Workflow

1. **Start Backend**:
   ```bash
   cd cloverSecurity-backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd cloversecurity-frontend
   npm run dev
   ```

3. **Login** dengan Google OAuth

4. **Create New Scan**:
   - Enter URL: `https://example.com`
   - Select Scan Type: Quick or Deep
   - Click "Start Security Scan"

5. **View Results**:
   - Vulnerabilities berasal langsung dari OWASP ZAP
   - Jumlah temuan akan bergantung pada target yang discan

## Production ZAP Integration

Untuk production, gunakan ZAP API:

```javascript
// Backend sudah support ini di zapService.js
// Cukup set environment variables:
ZAP_API_URL=http://zap-server:8080
ZAP_API_KEY=your-production-api-key
```

Backend akan gagal ketika ZAP tidak tersedia – jalankan daemon dulu sebelum trigger scan.
