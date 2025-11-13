# 🔍 Panduan Lengkap: Cara Kerja Security Scanning

## 📌 Konsep Dasar

Seperti yang kamu bilang, untuk scan web tinggal paste link (URL), tapi sebenarnya ada proses panjang di background. Mari saya jelaskan step-by-step:

---

## 🎯 1. Apa Itu Target?

**Target = Website yang ingin kamu scan**

### Informasi Target yang Diperlukan:

```
📌 TARGET WEBSITE
├─ URL/Link: https://example.com
│  └─ Ini adalah alamat websitenya
│
├─ Nama: "My App Staging"
│  └─ Nama friendly agar mudah diingat
│
├─ Deskripsi: "Staging environment untuk testing"
│  └─ Catatan opsional, untuk dokumentasi
│
└─ Tags: "staging, critical, payment"
   └─ Label untuk kategori & organisasi
```

**Kenapa perlu di-save sebagai Target?**
- Tidak perlu paste URL setiap kali scan
- Bisa scan target yang sama berkali-kali
- Track scanning history per target
- Organize multiple websites

---

## 🔎 2. Proses Scanning (Step-by-Step)

### Step 1: User Paste URL
```
User: "Scan https://example.com"
System: "Oke, mulai scan..."
```

### Step 2: Backend Receive Request
```javascript
startScan(req.body) {
  url: "https://example.com",
  scanType: "quick" atau "full",
  targetId: 123 (opsional)
}
```

### Step 3: Create Scan Record
```sql
INSERT INTO Scans:
├─ id: 1
├─ url: "https://example.com"
├─ status: "pending"  ← Scan belum dimulai
├─ scanType: "quick"
└─ userId: 456
```

### Step 4: Send ke ZAP Scanner (Background)
```
ZAP = OWASP ZAP (Open Source Security Scanner)

ZAP Process:
1️⃣ SPIDER SCAN (Crawling)
   └─ Jelajahi semua halaman di website
   └─ Cari semua link, form, endpoint
   └─ Result: Map struktur website

2️⃣ ACTIVE SCAN (Security Testing)
   └─ Inject payload ke semua input
   └─ Coba berbagai exploit
   └─ Lihat mana yang vulnerable
   └─ Result: List kerentanan (vulnerabilities)

3️⃣ GENERATE REPORT
   └─ Kumpulin semua vulnerabilities
   └─ Kategorisasi severity (Critical, High, Medium, Low)
   └─ Return hasil ke backend
```

### Step 5: Extract Vulnerability Data

```javascript
// ZAP returns alerts (vulnerabilities):
[
  {
    name: "SQL Injection",
    risk: "critical",       // severity
    confidence: "high",
    url: "https://example.com/login",
    param: "username",      // parameter yang vulnerable
    description: "Possible SQL Injection attack...",
    solution: "Use parameterized queries..."
  },
  // ... lebih banyak vulnerabilities
]
```

### Step 6: Save Vulnerability Records
```sql
INSERT INTO Vulnerabilities:
├─ scanId: 1
├─ name: "SQL Injection"
├─ severity: "critical"
├─ url: "https://example.com/login"
├─ parameter: "username"
└─ description: "..."
```

### Step 7: Update Scan Status
```sql
UPDATE Scans SET:
├─ status: "completed" ← Selesai!
├─ totalVulnerabilities: 42
├─ criticalCount: 5
├─ highCount: 12
├─ mediumCount: 18
├─ lowCount: 7
├─ scanDuration: 3600 (seconds)
└─ completedAt: "2025-11-13 10:30:00"
```

---

## 🌐 3. Deteksi IP & Network Info

**Bagian Ini TIDAK Otomatis dari URL:**

Saat scan dilakukan, ZAP bisa mendeteksi:

```
Input: https://example.com

ZAP Detects:
├─ Domain: example.com
├─ IP Address: 203.0.113.45 (via DNS lookup)
├─ Server: "nginx/1.25.0"
├─ Headers: X-Powered-By: "PHP/8.2"
├─ SSL/TLS Version: TLS 1.3
└─ Security Headers: Missing, Misconfigured, etc.
```

**TAPI:** IP detection ini optional dan tergantung:
- Ketersediaan API (GeoIP, DNS)
- Konfigurasi ZAP
- Permissions & firewall

**Untuk simpel:** Kita fokus di vulnerability scanning dulu, IP detection bisa ditambah later.

---

## 📊 4. Scan Types Dijelaskan

### Quick Scan (⚡ ~5-15 menit)
```
Hanya basic check:
├─ Spider crawling (limited depth)
├─ Quick vulnerability check
└─ Focus: Common vulnerabilities
   └─ SQL Injection, XSS, CSRF, etc.
```

**Cocok untuk:** Daily testing, staging environment

### Full Scan (🔬 ~30-60 menit)
```
Comprehensive testing:
├─ Deep spider crawling
├─ Full active scanning
├─ Fuzzing & brute force
├─ API testing
└─ Focus: Find maximum vulnerabilities
```

**Cocok untuk:** Production releases, security audit, penetration testing

---

## 🛡️ 5. Vulnerability Severity Levels

| Level | Risk | Example | Action |
|-------|------|---------|--------|
| 🔴 **CRITICAL** | Immediate exploit possible | SQL Injection, RCE | Fix ASAP |
| 🟠 **HIGH** | Can cause significant damage | XSS, Authentication bypass | Fix ASAP |
| 🟡 **MEDIUM** | Should be fixed soon | Weak SSL, Missing headers | Fix soon |
| 🔵 **LOW** | Minor security risk | Outdated libraries hints | Fix eventually |

---

## 💡 6. Dashboard Fitur Utama

### ✅ Apa yang bisa dilakukan dari Dashboard:

```
🏠 DASHBOARD
├─ 📊 Quick Stats
│  ├─ Total Scans: 42
│  ├─ Vulnerabilities Found: 256
│  ├─ Critical Issues: 12
│  └─ Avg Scan Time: 450s
│
├─ 🔴 Recent Scans
│  ├─ Scan ID | Target | Status | Severity | Time
│  ├─ #1 | example.com | ✅ Complete | 12 critical | 2min ago
│  ├─ #2 | app.test | ⏳ Scanning | ... | ongoing
│  └─ #3 | api.prod | ❌ Failed | error msg | 1hour ago
│
├─ 🎯 Quick Actions
│  ├─ [+ Create New Scan]  ← Ke NewScan page
│  ├─ [+ Add Target]       ← Ke Targets page
│  └─ [View All Scans]     ← Ke ScanList page
│
└─ 🔗 Quick Add Target (NEW)
   ├─ Bisa langsung add target dari dashboard
   ├─ Modal form yang cantik
   └─ Tanpa harus ke halaman Targets dulu
```

---

## 🎯 7. Complete User Flow

```
┌─────────────────────────────────────────────────────────┐
│                    USER JOURNEY                          │
└─────────────────────────────────────────────────────────┘

1. SETUP PHASE
   User: "Aku mau scan apa sih?"
   └─> Ke Targets page → Add Target: https://example.com
       └─> Target di-save ke database
           └─> Can reuse anytime

2. SCANNING PHASE
   User: "Mulai scan targets"
   └─> Dashboard → Click "Create New Scan"
       OR
       Targets → Click target → Select "Scan Now"
       └─> Form appears: URL auto-filled dari target
       └─> Choose scan type: Quick / Full
       └─> Click "Start Scan"

3. RUNNING PHASE (Background)
   └─> Status: "⏳ Scanning..." (shows progress)
   └─> Backend running: Spider → Active Scan
   └─> Scan takes 5-60 minutes

4. RESULTS PHASE
   └─> Status: "✅ Completed"
   └─> Dashboard shows:
       ├─ 42 Vulnerabilities found
       ├─ 5 Critical, 12 High, 18 Medium, 7 Low
       ├─ Scan took 12 minutes 34 seconds
       └─ [View Detailed Report]

5. ANALYSIS PHASE
   User: "Apa ini vulnerability?"
   └─> Click vulnerability
   └─> AI Explanation (powered by Gemini)
       ├─ What is this vulnerability?
       ├─ Why is it dangerous?
       ├─ How to fix it?
       └─ Code examples
```

---

## 🚀 8. Getting Started

### Untuk User Baru:

1. **Create Target**
   ```
   Go to Targets page
   Click "Add Target"
   Fill:
   - URL: https://yourdomain.com
   - Name: My Website
   - Description: Production environment
   - Tags: production, main
   Click "Save Target"
   ```

2. **Start First Scan**
   ```
   Go to Dashboard
   Click "Create New Scan" (NEW - Quick Add)
   Select Target: My Website
   Choose Type: Quick (untuk first time)
   Click "Start Scan"
   ```

3. **Wait for Results**
   ```
   See status: ⏳ Scanning...
   Can close page, get notified when done
   ```

4. **Review Results**
   ```
   Click on vulnerability
   Get AI explanation
   Fix issue di code
   Scan again
   ```

---

## 📝 Input Fields Penjelasan

### URL/Link
```
Input:  https://example.com
Purpose: Tell ZAP where to scan
Format: MUST start with http:// or https://
Example valid URLs:
- https://example.com
- http://localhost:3000
- https://api.test.com/app
- https://staging.myapp.co.id
```

### Scan Name/Description
```
Purpose: Help remember what this scan is for
Example:
- Name: "Q4 Security Audit"
- Description: "Full penetration test before launch"

Helps when you have 100+ scans and need to find specific one!
```

### Tags
```
Purpose: Organize and filter scans
Example tags:
- production, staging, testing
- critical, regular, weekly
- api, frontend, backend
- payment, auth, database

Query examples:
- "Show me all production scans"
- "All critical scans in Q4"
- "Payment module tests"
```

---

## ⚠️ Catatan Penting

✅ **URL tinggal paste saja**, sistem yang handle sisanya
✅ **ZAP otomatis detect**: IP, Server version, Headers, SSL info
✅ **Vulnerability otomatis diidentifikasi**: Severity, Type, Location
✅ **AI explanation nantinya** akan jelaskan setiap kerentanan

❌ **Tidak perlu input IP manual**
❌ **Tidak perlu input server details manual**
❌ **Scan automated, tinggal tunggu hasil**

---

Sekarang sudah jelas? Target dan Scan itu sederhana kok! 😊

Selanjutnya kita improve UI-nya biar lebih cantik dan user-friendly! 🎨
