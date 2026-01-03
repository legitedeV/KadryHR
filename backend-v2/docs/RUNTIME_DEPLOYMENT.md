# Backend Runtime and Deployment Guide

## Overview

This document describes how to run the backend-v2 application in different environments and verify that it starts correctly.

## Prerequisites

- Node.js 18+ (recommended: 22.x)
- PostgreSQL database
- Redis server (optional, for background jobs)
- SMTP server (optional, for email notifications)

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

### Required Variables

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
```

### Optional Variables

```bash
# Application
APP_PORT=4000  # Default: 3000

# JWT
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"

# Database
DATABASE_MAX_RETRIES=5
DATABASE_RETRY_DELAY_MS=2000

# Redis (optional - for background job queues)
REDIS_HOST="localhost"
REDIS_PORT=6379

# SMTP (optional - for email notifications)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

**Note:** The application will start successfully even if Redis or SMTP are not configured. Email notifications will be skipped gracefully, and background jobs will fall back to synchronous processing.

## Development Mode

### Install Dependencies

```bash
npm install
```

### Run in Watch Mode

```bash
npm run start:dev
```

The server will start on the configured port (default: 4000) and automatically reload on file changes.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## Production Mode

### Build the Application

```bash
npm run build
```

This will:
1. Run `prisma generate` to generate the Prisma Client
2. Compile TypeScript to JavaScript in the `dist/` directory

### Start Production Server

```bash
npm run start:prod
```

Or directly with Node:

```bash
node dist/main
```

## PM2 Deployment

PM2 is a production process manager for Node.js applications.

### Install PM2

```bash
npm install -g pm2
```

### Create PM2 Ecosystem File

Create a file named `ecosystem.config.js` in the backend-v2 directory:

```javascript
module.exports = {
  apps: [{
    name: 'kadryhr-backend',
    script: 'dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      APP_PORT: 4000,
    },
    env_file: '.env',
  }],
};
```

### Start with PM2

```bash
# Build first
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs kadryhr-backend

# Monitor
pm2 monit

# Stop
pm2 stop kadryhr-backend

# Restart
pm2 restart kadryhr-backend

# Delete from PM2
pm2 delete kadryhr-backend
```

### PM2 Auto-Startup

To ensure PM2 restarts on system reboot:

```bash
pm2 startup
pm2 save
```

## Verifying the Deployment

### Health Check

Once the server is running, verify it's working:

```bash
# Check if server is responding
curl http://localhost:4000/api

# Expected: 404 or API response (not connection refused)
```

### Check Logs

Development mode:
```bash
# Logs are output to console
```

Production with PM2:
```bash
pm2 logs kadryhr-backend
```

### Common Issues

#### Database Connection Failed

**Error:** `Error: P1001: Can't reach database server`

**Solution:** Verify:
- PostgreSQL is running
- DATABASE_URL is correct
- Database exists
- User has proper permissions

#### Redis Connection Warning

**Warning:** `Email delivery queue not available`

**Solution:** This is expected if Redis is not running. The application will continue to work, processing emails synchronously instead of through a queue.

#### Email Configuration Warning

**Warning:** `Email adapter not configured - skipping email delivery`

**Solution:** This is expected if SMTP is not configured. The application will continue to work without email functionality.

## DI/Wiring Architecture

### Module Structure

The application uses a modular architecture to avoid circular dependencies:

- **EmailModule** - Provides `EmailAdapter` for sending emails
- **QueueModule** - Provides `QueueService` and `EmailQueueProcessor`, imports `EmailModule`
- **NotificationsModule** - Provides `NotificationsService`, imports `EmailModule` and `QueueModule`
- **AppModule** - Imports all feature modules

### Dependency Flow

```
AppModule
  ├─ EmailModule (provides EmailAdapter)
  ├─ QueueModule (imports EmailModule, provides QueueService)
  └─ NotificationsModule (imports EmailModule + QueueModule)
```

This structure ensures no circular dependencies in the DI container.

## Troubleshooting

### Module Import Errors

If you see errors like:
```
Nest can't resolve dependencies of EmailQueueProcessor
```

This indicates a DI wiring issue. Verify:
1. All required modules are imported
2. All providers are registered
3. No circular dependencies exist

### Build Failures

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### Runtime Startup Issues

Check PM2 logs for detailed error messages:
```bash
pm2 logs kadryhr-backend --lines 100
```

Look for:
- Database connection errors
- Missing environment variables
- Module resolution errors
- Port already in use

## Performance Tuning

### PM2 Cluster Mode

For better performance, run multiple instances:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'kadryhr-backend',
    script: 'dist/main.js',
    instances: 'max', // or specific number like 4
    exec_mode: 'cluster',
    // ... other config
  }],
};
```

### Database Connection Pool

Adjust in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings via URL parameters:
  // postgresql://...?connection_limit=20&pool_timeout=20
}
```

## Support

For issues or questions, check:
1. Application logs
2. PM2 logs (`pm2 logs`)
3. System logs (`journalctl -u nginx` for nginx, etc.)
4. Database logs
