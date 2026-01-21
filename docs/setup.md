# KadryHR v2 - Setup Guide

Complete guide to setting up KadryHR v2 for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm** 8.0.0 or higher (Install: `npm install -g pnpm`)
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

Verify installations:
```bash
node --version    # Should be >= 18.0.0
pnpm --version    # Should be >= 8.0.0
docker --version  # Should be installed
```

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/legitedeV/KadryHR.git
cd KadryHR
```

### 2. Install Dependencies

Install all workspace dependencies:

```bash
pnpm install
```

This will install dependencies for:
- Root workspace
- Backend API (`apps/api`)
- Frontend web app (`apps/web`)
- Shared packages

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

The default `.env` values are configured for local development. Key settings:

```env
# Database
DATABASE_URL=postgresql://kadryhr:password@localhost:5432/kadryhr

# Redis
REDIS_URL=redis://localhost:6379

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=kadryhr-files
MINIO_USE_SSL=false

# Application
NODE_ENV=development
API_PORT=3000
API_HOST=0.0.0.0

# Domains (for local development with subdomains)
LANDING_DOMAIN=kadryhr.localtest.me
PANEL_DOMAIN=panel.kadryhr.localtest.me
ADMIN_DOMAIN=admin.kadryhr.localtest.me
COOKIE_DOMAIN=.localtest.me

# Session Security
SESSION_SECRET=change-this-to-a-random-secret-in-production

# CORS
CORS_ORIGIN=http://kadryhr.localtest.me:5173,http://panel.kadryhr.localtest.me:5173,http://admin.kadryhr.localtest.me:5173
```

**Note**: `localtest.me` is a magic domain that resolves to `127.0.0.1` and works with all subdomains. No hosts file modification needed!

### 4. Start Docker Services

Start PostgreSQL, Redis, and MinIO:

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

You should see three containers running:
- `kadryhr-postgres` (port 5432)
- `kadryhr-redis` (port 6379)
- `kadryhr-minio` (ports 9000, 9001)

#### MinIO Console Access

Access MinIO web console at http://localhost:9001:
- Username: `minioadmin`
- Password: `minioadmin`

### 5. Run Database Migrations

Create database tables:

```bash
pnpm db:migrate
```

This will:
- Connect to PostgreSQL
- Run all migrations in `apps/api/src/db/migrations`
- Create all tables, indexes, and constraints

### 6. Seed Database

Populate with example data:

```bash
pnpm db:seed
```

This creates:
- **Organization**: "Example Firma"
- **Owner user**: admin@example.com / password123
- **10 employees** with various positions and tags
- **3 positions**: Kelner, Kucharz, Barman
- **3 tags**: Full-time, Part-time, Student
- **Default schedule** with 15-20 shifts in current month
- **5 availability entries** with various statuses
- **5 holidays** for current year
- **1 integration** (Google, disabled)

### 7. Start Development Servers

Start both API and Web servers:

```bash
pnpm dev
```

This runs:
- **API server** on http://localhost:3000
- **Web dev server** on http://localhost:5173 (with subdomain routing)

Alternatively, run individually:

```bash
# Terminal 1: API only
pnpm dev:api

# Terminal 2: Web only  
pnpm dev:web
```

### 8. Access the Application

#### Landing Page
http://kadryhr.localtest.me:5173

#### Panel (Main App)
http://panel.kadryhr.localtest.me:5173

#### Login
Navigate to http://panel.kadryhr.localtest.me:5173/login

**Credentials**:
- Email: `admin@example.com`
- Password: `password123`

#### API Documentation (Swagger)
http://localhost:3000/docs

## Troubleshooting

### Port Already in Use

If ports 3000, 5173, 5432, 6379, 9000, or 9001 are in use:

1. **Check running processes**:
   ```bash
   lsof -i :3000  # Check specific port
   ```

2. **Stop conflicting services** or change ports in `.env` and `docker-compose.yml`

### Docker Services Not Starting

1. **Check Docker is running**:
   ```bash
   docker info
   ```

2. **View service logs**:
   ```bash
   docker-compose logs postgres
   docker-compose logs redis
   docker-compose logs minio
   ```

3. **Reset Docker volumes** (⚠️ This deletes all data):
   ```bash
   docker-compose down -v
   docker-compose up -d
   pnpm db:migrate
   pnpm db:seed
   ```

### Database Connection Errors

1. **Verify PostgreSQL is running**:
   ```bash
   docker-compose ps postgres
   ```

2. **Test connection**:
   ```bash
   docker-compose exec postgres psql -U kadryhr -d kadryhr -c "SELECT 1;"
   ```

3. **Check DATABASE_URL** in `.env` matches Docker credentials

### Subdomain Not Working

If `kadryhr.localtest.me` doesn't resolve:

1. **Verify DNS resolution**:
   ```bash
   ping kadryhr.localtest.me
   # Should resolve to 127.0.0.1
   ```

2. **Alternative**: Use localhost with port
   - Update `.env` domains to `localhost:5173`
   - Update `COOKIE_DOMAIN` to `localhost`
   - Cookies won't work across subdomains, but auth will work on single domain

### Build Errors

1. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   pnpm install
   ```

2. **Clear build cache**:
   ```bash
   rm -rf apps/api/dist apps/web/dist
   pnpm build
   ```

## Development Workflow

### Making Changes

1. **Backend changes**: Files auto-reload (tsx watch)
2. **Frontend changes**: Hot module replacement (Vite HMR)

### Database Changes

1. **Modify schema** in `apps/api/src/db/schema.ts`
2. **Generate migration**:
   ```bash
   cd apps/api
   pnpm db:generate
   ```
3. **Run migration**:
   ```bash
   pnpm db:migrate
   ```

### Running Tests

```bash
# All tests
pnpm test

# API tests only
pnpm --filter @kadryhr/api test

# Web tests only
pnpm --filter @kadryhr/web test

# E2E tests
pnpm e2e
```

### Code Quality

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format
```

## Production Deployment

### Environment Variables

For production, update `.env`:

1. **Change all secrets**:
   - `SESSION_SECRET` - Generate random string
   - Database passwords
   - MinIO credentials

2. **Update domains**:
   - `LANDING_DOMAIN` - Your landing domain
   - `PANEL_DOMAIN` - Your panel subdomain
   - `COOKIE_DOMAIN` - Your root domain (with leading dot)

3. **Enable security**:
   - Set `NODE_ENV=production`
   - Set `MINIO_USE_SSL=true` (if using HTTPS)

### Build for Production

```bash
pnpm build
```

This creates:
- `apps/api/dist` - Compiled backend
- `apps/web/dist` - Optimized frontend bundle

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production containers
docker-compose -f docker-compose.prod.yml up -d
```

## Next Steps

- [ ] Set up Google OAuth (optional)
- [ ] Configure email service for password recovery
- [ ] Set up CI/CD pipeline
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Review security settings
- [ ] Configure SSL/TLS certificates

## Getting Help

- **Issues**: GitHub Issues
- **Documentation**: [Feature Matrix](./feature-parity-matrix.md)
- **API Docs**: http://localhost:3000/docs

---

**Happy coding!** 🚀
