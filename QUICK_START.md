# Quick Start Guide - KadryHR V2

## ✅ Problem Fixed!
The 404 error on `/login` and `/register` has been resolved.

## 🚀 Services Running

### API (Port 3002)
- **URL**: http://localhost:3002/v2
- **Health**: http://localhost:3002/v2/health
- **Docs**: http://localhost:3002/docs
- **Status**: ✅ Running

### Web Frontend (Port 3001)
- **URL**: http://localhost:3001
- **Register**: http://localhost:3001/register
- **Login**: http://localhost:3001/login
- **Status**: ✅ Running

## 🧪 Test the Fix

### Option 1: Run Test Script
```bash
./test-registration.sh
```

### Option 2: Manual Test
```bash
# Test API health
curl http://localhost:3002/v2/health

# Test registration
curl -X POST http://localhost:3002/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "organizationName": "My Company"
  }'
```

### Option 3: Browser Test
1. Open: http://localhost:3001/register
2. Fill in the form:
   - Organization Name: "Test Company"
   - Full Name: "Jane Smith"
   - Email: "jane@test.com"
   - Password: "password123"
3. Click "Utwórz konto" (Create Account)
4. ✅ Should succeed without 404 error!

## 📁 Configuration Files

### Frontend Environment
**File**: `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/v2
```

### API Environment
**File**: `apps/api/.env`
```env
NODE_ENV=development
PORT=3002
API_PREFIX=v2
DATABASE_URL=file:./dev.db
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d
CORS_ORIGIN=*
```

## 🔄 Restart Services

If services stop, restart them:

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

## 📊 What Was Fixed

1. ✅ Created `.env.local` with correct API URL
2. ✅ Configured SQLite database for local development
3. ✅ Fixed Prisma schema for SQLite compatibility
4. ✅ Removed PostgreSQL-specific features from code
5. ✅ Started both API and Web services
6. ✅ Verified all endpoints work correctly

## 🎯 Available Endpoints

### Authentication
- `POST /v2/auth/register` - Create new account
- `POST /v2/auth/login` - Login
- `GET /v2/auth/me` - Get current user

### Health
- `GET /v2/health` - API health check
- `GET /v2/version` - API version info

### Documentation
- `GET /docs` - Swagger API documentation

## 📝 Notes

- Database: SQLite (`apps/api/prisma/dev.db`)
- First user in organization becomes OWNER
- JWT tokens expire after 1 day
- CORS is enabled for all origins in development

## 🐛 Troubleshooting

### API not responding?
```bash
# Check if API is running
ps aux | grep "nest"

# Check API logs
tail -f /tmp/api.log

# Restart API
cd apps/api && npm run dev
```

### Frontend not loading?
```bash
# Check if Web is running
ps aux | grep "next"

# Check Web logs
tail -f /tmp/web.log

# Restart Web
cd apps/web && npm run dev
```

### Database issues?
```bash
# Regenerate Prisma client
cd apps/api
npx prisma generate

# Reset database
rm prisma/dev.db
npx prisma migrate dev --name init
```

## 📚 Documentation

- Full solution: `SOLUTION_SUMMARY.md`
- API access guide: `API_ACCESS_GUIDE.txt`
- Test script: `test-registration.sh`

---

**Status**: ✅ All systems operational
**Last Updated**: 2025-12-26
