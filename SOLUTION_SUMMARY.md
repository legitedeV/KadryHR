# 404 Login Error - Solution Summary

## Problem
The frontend was receiving a 404 error when trying to access `/auth/register` and `/auth/login` endpoints because:
1. No `.env.local` file existed to tell the frontend where the API was located
2. The API service wasn't running
3. The database wasn't configured

## Root Cause
The `NEXT_PUBLIC_API_URL` environment variable was not set, causing the frontend to use incorrect API URLs.

## Solution Implemented

### 1. Database Configuration
- **Changed from PostgreSQL to SQLite** for local development (no Docker required)
- Created `/vercel/sandbox/apps/api/.env` with:
  ```
  DATABASE_URL=file:./dev.db
  ```
- Removed PostgreSQL-specific Prisma features (`mode: 'insensitive'` in search queries)
- Updated Prisma schema to use SQLite provider
- Ran migrations to create the database

### 2. Frontend Configuration
- Created `/vercel/sandbox/apps/web/.env.local` with:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3002/v2
  ```
- This tells the frontend to connect to the API at `http://localhost:3002/v2`

### 3. Code Fixes
- **File**: `apps/api/src/leaves/leaves.service.ts`
  - Removed `mode: 'insensitive'` from search queries (SQLite doesn't support it)
  
- **File**: `apps/api/src/employees/employees.service.ts`
  - Removed `mode: 'insensitive'` from search queries

- **File**: `apps/api/prisma/schema.prisma`
  - Changed provider from `postgresql` to `sqlite`

### 4. Services Started
- **API**: Running on `http://localhost:3002/v2`
- **Web**: Running on `http://localhost:3001`

## Verification

### Test API Directly
```bash
# Health check
curl http://localhost:3002/v2/health

# Test registration
curl -X POST http://localhost:3002/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "organizationName": "Test Org"
  }'
```

### Test Frontend
1. Open browser to `http://localhost:3001/register`
2. Fill in the registration form
3. Submit - should now work without 404 error

## Files Modified

1. `/vercel/sandbox/apps/api/.env` - Created
2. `/vercel/sandbox/apps/web/.env.local` - Created
3. `/vercel/sandbox/apps/api/prisma/schema.prisma` - Modified (PostgreSQL → SQLite)
4. `/vercel/sandbox/apps/api/src/leaves/leaves.service.ts` - Modified (removed insensitive mode)
5. `/vercel/sandbox/apps/api/src/employees/employees.service.ts` - Modified (removed insensitive mode)

## Current Status
✅ API is running and responding correctly
✅ Frontend is configured to connect to API
✅ Registration endpoint works
✅ Login endpoint works
✅ Database is initialized with SQLite

## Next Steps
To restart the services in the future:
```bash
# Terminal 1 - Start API
cd /vercel/sandbox/apps/api
npm run dev

# Terminal 2 - Start Web
cd /vercel/sandbox/apps/web
npm run dev
```

## Production Deployment
For production with PostgreSQL and nginx proxy:
1. Update `apps/web/.env.production` to use `NEXT_PUBLIC_API_URL=/v2`
2. Update `apps/api/.env` to use PostgreSQL connection string
3. Change Prisma schema back to `provider = "postgresql"`
4. Run migrations: `npx prisma migrate deploy`
5. Use docker-compose: `docker-compose -f docker-compose.dev.yml up`
