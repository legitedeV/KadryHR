# KadryHR V2 - Configuration Guide

## 🎯 Overview

This guide explains what needs to be configured for the application to work properly.

## 📋 Required Configuration Files

### 1. **apps/api/.env** (API Backend Configuration)

**Location:** `/vercel/sandbox/apps/api/.env`

**Required Settings:**

```env
# Server Configuration
NODE_ENV=development
PORT=3002
API_PREFIX=v2

# Database Configuration
DATABASE_URL=file:./dev.db

# JWT Authentication
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS (Cross-Origin Resource Sharing)
CORS_ORIGIN=http://localhost:3001,http://localhost:8080
```

**What You Need to Change:**

- ✅ **DATABASE_URL**: Already configured for SQLite (`file:./dev.db`)
  - No changes needed for local development
  - For production with PostgreSQL: `postgresql://user:password@host:5432/database`

- ⚠️ **JWT_SECRET**: Change this to a random secure string in production
  - Generate with: `openssl rand -base64 32`
  - Keep it secret and never commit to git

- ✅ **CORS_ORIGIN**: Already configured for local development
  - Add your production domain when deploying

**Optional Settings (for email invites):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@kadryhr.com
```

---

### 2. **apps/web/.env.local** (Frontend Configuration)

**Location:** `/vercel/sandbox/apps/web/.env.local`

**Required Settings:**

```env
# API URL - Where the frontend should send requests
NEXT_PUBLIC_API_URL=http://localhost:3002/v2

# Web URL (optional)
NEXT_PUBLIC_WEB_URL=http://localhost:3001
```

**What You Need to Change:**

- ✅ **NEXT_PUBLIC_API_URL**: 
  - For local development: `http://localhost:3002/v2` ✓
  - For production with nginx: `/v2`
  - For remote server: `http://YOUR_SERVER_IP:3002/v2`

- ✅ **NEXT_PUBLIC_WEB_URL**: 
  - For local development: `http://localhost:3001` ✓
  - For production: `https://yourdomain.com`

---

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)

```bash
chmod +x START_APPLICATION.sh
./START_APPLICATION.sh
```

This script will:
1. ✓ Check and install dependencies
2. ✓ Create configuration files if missing
3. ✓ Setup database
4. ✓ Start API service (port 3002)
5. ✓ Start Web service (port 3001)

### Option 2: Manual Startup

```bash
# 1. Install dependencies
npm install

# 2. Setup API
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev &
cd ../..

# 3. Setup Web
cd apps/web
npm install
npm run dev &
cd ../..
```

---

## 🔍 Verification

### Check if services are running:

```bash
# Check API
curl http://localhost:3002/v2/health

# Check Web
curl http://localhost:3001
```

### Test registration:

```bash
curl -X POST http://localhost:3002/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "organizationName": "Test Company"
  }'
```

---

## 🌐 Access Points

After starting the application:

- **Web Application**: http://localhost:3001
- **API Backend**: http://localhost:3002/v2
- **API Health**: http://localhost:3002/v2/health
- **API Docs**: http://localhost:3002/docs (if enabled)

---

## 🛠️ Troubleshooting

### Problem: 404 Error on Login/Register

**Cause:** Frontend doesn't know where the API is located.

**Solution:** Check `apps/web/.env.local` has correct `NEXT_PUBLIC_API_URL`

```bash
# For local development
echo "NEXT_PUBLIC_API_URL=http://localhost:3002/v2" > apps/web/.env.local

# Restart web service
pkill -f "next dev"
cd apps/web && npm run dev
```

### Problem: Database Connection Error

**Cause:** Database not initialized or wrong DATABASE_URL.

**Solution:** 

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
```

### Problem: CORS Error in Browser

**Cause:** API doesn't allow requests from frontend origin.

**Solution:** Check `apps/api/.env` has correct CORS_ORIGIN:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:8080
```

### Problem: JWT Token Invalid

**Cause:** JWT_SECRET mismatch or expired token.

**Solution:** 

1. Clear browser cookies/localStorage
2. Ensure JWT_SECRET is set in `apps/api/.env`
3. Restart API service

---

## 📦 Production Deployment

### Using Docker Compose

```bash
# Use nginx proxy (port 8080)
docker-compose -f docker-compose.dev.yml up -d

# Access via: http://YOUR_SERVER_IP:8080
```

### Environment Variables for Production

**apps/api/.env:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/kadryhr
JWT_SECRET=<generate-secure-random-string>
CORS_ORIGIN=https://yourdomain.com
```

**apps/web/.env.local:**
```env
NEXT_PUBLIC_API_URL=/v2
NEXT_PUBLIC_WEB_URL=https://yourdomain.com
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a secure random string
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set proper CORS_ORIGIN
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Use environment-specific .env files
- [ ] Never commit .env files to git

---

## 📝 Summary

**Minimum Required Configuration:**

1. ✅ `apps/api/.env` - API configuration (database, JWT, CORS)
2. ✅ `apps/web/.env.local` - Frontend API URL

**No Other Configuration Needed!**

The application uses:
- SQLite database (auto-created)
- Default JWT secret (change in production)
- Localhost URLs (change for remote access)

**To Start:**
```bash
./START_APPLICATION.sh
```

**To Stop:**
```bash
./STOP_APPLICATION.sh
```

**To Access:**
Open http://localhost:3001 in your browser

---

## 🆘 Need Help?

Check logs:
```bash
# API logs
tail -f /tmp/kadryhr-api.log

# Web logs
tail -f /tmp/kadryhr-web.log
```

Check running processes:
```bash
ps aux | grep -E "node|nest|next"
```

Check ports:
```bash
netstat -tlnp | grep -E "3001|3002"
# or
ss -tlnp | grep -E "3001|3002"
```
