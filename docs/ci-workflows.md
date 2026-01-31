# CI/CD Workflows Documentation

This document provides comprehensive information about all GitHub Actions workflows in the KadryHR project.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
  - [CI/CD Pipeline](#cicd-pipeline)
  - [Prisma Migration Validation](#prisma-migration-validation)
  - [E2E Tests](#e2e-tests)
  - [Security Scanning](#security-scanning)
  - [Build Artifacts](#build-artifacts)
  - [Deploy to VPS](#deploy-to-vps)
- [Debugging Workflow Failures](#debugging-workflow-failures)
- [Running Tests Locally](#running-tests-locally)
- [Required Secrets](#required-secrets)
- [Dependabot Configuration](#dependabot-configuration)

---

## Overview

KadryHR uses GitHub Actions for continuous integration and deployment. The workflows are designed to:
- Ensure code quality through linting and testing
- Validate database schema changes
- Run end-to-end tests
- Scan for security vulnerabilities
- Build production artifacts
- Deploy to VPS

All workflows use Node.js 20 and leverage npm caching for efficiency.

---

## Workflows

### CI/CD Pipeline

**File**: `.github/workflows/ci.yml`

**Triggers**: 
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Purpose**: Run linting and unit tests for both backend and frontend.

**Jobs**:
- `backend-lint-and-test`: ESLint + Jest tests for NestJS backend
- `frontend-lint-and-test`: ESLint + tests for Next.js frontend

**When it runs**: On every push and PR to main/develop branches

**Duration**: ~3-5 minutes

---

### Prisma Migration Validation

**File**: `.github/workflows/prisma-migration-check.yml`

**Triggers**:
- Pull requests to `main` or `develop` (only when Prisma files change)

**Purpose**: Prevent broken database migrations from reaching production by validating schema changes.

**Services**:
- PostgreSQL 16 (for validation)

**Steps**:
1. Checkout code
2. Install backend dependencies
3. Generate Prisma Client
4. Validate schema syntax with `prisma migrate diff`
5. Check migration status
6. Validate schema can be applied with `prisma db push`
7. Generate job summary

**Environment Variables**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kadryhr_test?schema=public
```

**When it runs**: Only on PRs when files in `backend-v2/prisma/**` or `backend-v2/package*.json` change

**Duration**: ~2-3 minutes

**How to debug failures**:
- Check if schema syntax is valid
- Ensure migrations are properly created with `prisma migrate dev`
- Test locally: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine`

---

### E2E Tests

**File**: `.github/workflows/e2e-tests.yml`

**Triggers**:
- Pull requests to `main` or `develop`
- Push to `main`

**Purpose**: Run Playwright end-to-end tests to catch integration issues before merge.

**Services**:
- PostgreSQL 16 (backend database)
- Redis 7 (for BullMQ job queue)

**Steps**:
1. Setup PostgreSQL and Redis
2. Install backend dependencies
3. Generate Prisma Client and push schema
4. Seed test data (if seed script exists)
5. Build and start backend server (port 3001)
6. Wait for backend health check
7. Install frontend dependencies
8. Install Playwright browsers (Chromium only)
9. Run Playwright tests
10. Upload test report on failure

**Environment Variables**:

Backend:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kadryhr_test?schema=public
APP_PORT=3001
JWT_ACCESS_SECRET=test-access-secret
JWT_REFRESH_SECRET=test-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_ENABLED=false
NODE_ENV=test
```

Frontend:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**When it runs**: On all PRs to main/develop, and post-merge validation on main

**Duration**: ~10-15 minutes

**Artifacts**: Playwright report (on failure, retained for 7 days)

**How to debug failures**:
- Download Playwright report artifact from failed run
- Check backend logs in workflow output
- See "Running Tests Locally" section below

---

### Security Scanning

**File**: `.github/workflows/security-scan.yml`

**Triggers**:
- Pull requests to `main`
- Push to `main`
- Weekly schedule (Monday 6 AM UTC)

**Purpose**: Detect security vulnerabilities in dependencies and code.

**Jobs**:

1. **NPM Audit** (Matrix: backend-v2, frontend-v2)
   - Runs `npm audit --audit-level=high`
   - Reports critical and high vulnerabilities
   - Continues on error (warnings only)
   - Uploads audit results as artifacts

2. **CodeQL Analysis**
   - Analyzes JavaScript/TypeScript code
   - Uploads SARIF results to GitHub Security tab
   - Runs security-extended and security-and-quality queries

3. **Security Summary**
   - Aggregates results from all jobs
   - Generates job summary

**When it runs**: 
- Every PR to main
- Every push to main
- Weekly on Monday at 6 AM UTC

**Duration**: ~5-10 minutes

**Artifacts**: NPM audit JSON results (retained for 30 days)

**How to view results**:
- Security findings: Repository → Security tab → Code scanning
- NPM audit details: Download artifacts from workflow run

---

### Build Artifacts

**File**: `.github/workflows/build-artifacts.yml`

**Triggers**: Push to `main`

**Purpose**: Create production-ready build artifacts for deployment.

**Steps**:
1. Lint and test both backend and frontend
2. Build backend (NestJS → dist/)
3. Build frontend (Next.js → .next/)
4. Package artifacts with dependencies and Prisma schema
5. Upload as GitHub artifact

**When it runs**: On every push to main

**Duration**: ~8-12 minutes

**Artifacts**: `kadryhr-build-{sha}` (retained for 14 days)

---

### Deploy to VPS

**File**: `.github/workflows/deploy.yml`

**Triggers**: Push to `main`

**Purpose**: Deploy the application to production VPS.

**Steps**:
1. SSH into VPS
2. Execute deployment script

**Required Secrets**:
- `VPS_HOST`: Server hostname/IP
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: SSH private key

**When it runs**: On every push to main

**Duration**: ~2-5 minutes (depends on VPS and deployment script)

---

## Debugging Workflow Failures

### General Debugging Steps

1. **Check the workflow logs**:
   - Go to Actions tab in GitHub
   - Click on the failed workflow run
   - Expand failed steps to see detailed logs

2. **Look for common issues**:
   - Dependency installation failures (check package-lock.json)
   - Test failures (run tests locally)
   - Environment variable issues (verify .env.example)
   - Service container health check failures

3. **Review recent changes**:
   - Check what changed in the PR
   - Look for changes to dependencies, config files, or database schema

### Specific Workflow Issues

#### Prisma Migration Check Fails
- **Schema syntax error**: Run `npx prisma validate` locally
- **Migration issues**: Ensure migrations are properly created
- **Database connection**: Check if PostgreSQL service is healthy

#### E2E Tests Fail
- **Backend won't start**: Check backend logs in workflow output
- **Database connection**: Verify DATABASE_URL is correct
- **Redis connection**: Ensure Redis service is healthy
- **Playwright issues**: Check if tests pass locally
- **Timeout issues**: Backend might be taking too long to start

#### Security Scan Fails
- **NPM audit**: High/critical vulnerabilities found - review and update dependencies
- **CodeQL**: Code quality/security issues detected - check Security tab for details

#### Build Artifacts Fails
- **Lint errors**: Fix linting issues in code
- **Test failures**: Fix failing unit tests
- **Build errors**: Check TypeScript errors or missing dependencies

---

## Running Tests Locally

### E2E Tests (Playwright)

#### Prerequisites
- Docker (for PostgreSQL and Redis)
- Node.js 20
- Backend and frontend dependencies installed

#### Steps

1. **Start PostgreSQL and Redis**:
```bash
# PostgreSQL
docker run -d --name postgres-test \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=kadryhr_test \
  postgres:16-alpine

# Redis
docker run -d --name redis-test \
  -p 6379:6379 \
  redis:7-alpine
```

2. **Setup backend**:
```bash
cd backend-v2

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and set:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kadryhr_test?schema=public
# APP_PORT=3001
# REDIS_HOST=localhost
# REDIS_PORT=6379
# EMAIL_ENABLED=false

# Generate Prisma Client and push schema
npx prisma generate
npx prisma db push --accept-data-loss

# (Optional) Seed data
npm run prisma:seed

# Build and start backend
npm run build
npm run start
```

3. **Run Playwright tests**:
```bash
cd frontend-v2

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Setup environment
cp .env.example .env
# Edit .env and set:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Run tests
npm run test:e2e

# Or run with UI mode
npx playwright test --ui

# Or run specific test
npx playwright test tests/smoke.spec.ts
```

4. **View test report**:
```bash
npx playwright show-report
```

5. **Cleanup**:
```bash
docker stop postgres-test redis-test
docker rm postgres-test redis-test
```

### Unit Tests

**Backend**:
```bash
cd backend-v2
npm test
```

**Frontend**:
```bash
cd frontend-v2
npm test
```

### Prisma Validation

```bash
cd backend-v2

# Validate schema
npx prisma validate

# Check migration status
npx prisma migrate status

# Test migration
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel=prisma/schema.prisma
```

---

## Required Secrets

### GitHub Secrets

Configure in: Repository Settings → Secrets and variables → Actions

#### Deployment Secrets
- `VPS_HOST`: Production VPS hostname or IP address
- `VPS_USER`: SSH username for VPS access
- `VPS_SSH_KEY`: SSH private key for authentication

#### Optional Secrets
- None required for CI workflows (they use GitHub-hosted services)

### Environment Variables in Workflows

All environment variables are defined in workflow files:
- No external secrets required for Prisma validation
- No external secrets required for E2E tests
- No external secrets required for security scanning

---

## Dependabot Configuration

**File**: `.github/dependabot.yml`

**Purpose**: Automatically create PRs for dependency updates.

**Configuration**:

1. **Backend NPM packages** (`/backend-v2`)
   - Weekly updates (Monday 6 AM)
   - Max 5 open PRs
   - Labels: `dependencies`, `backend`

2. **Frontend NPM packages** (`/frontend-v2`)
   - Weekly updates (Monday 6 AM)
   - Max 5 open PRs
   - Labels: `dependencies`, `frontend`

3. **GitHub Actions** (`/`)
   - Weekly updates (Monday 6 AM)
   - Labels: `dependencies`, `ci`

**How to handle Dependabot PRs**:

1. Review the changelog/release notes
2. Check if CI passes
3. For security updates: Merge immediately
4. For minor/patch updates: Review and merge
5. For major updates: Review breaking changes, update code if needed

**Disabling Dependabot PRs temporarily**:
```bash
# Comment on Dependabot PR:
@dependabot ignore this major version
@dependabot ignore this minor version
@dependabot ignore this dependency
```

---

## Best Practices

### When Adding New Dependencies

1. Check for security vulnerabilities: `npm audit`
2. Review package reputation and maintenance status
3. Test locally before committing
4. Let Dependabot handle updates after initial addition

### When Modifying Prisma Schema

1. Always create migrations: `npx prisma migrate dev`
2. Test migrations locally before pushing
3. Never manually edit migration files
4. Use `prisma migrate diff` to preview changes

### When Adding E2E Tests

1. Keep tests focused and independent
2. Use data-testid attributes for reliable selectors
3. Clean up test data after tests
4. Keep tests under 60 seconds timeout
5. Use Playwright's built-in waiting mechanisms

### When Workflow Fails

1. Don't force-push to bypass checks
2. Debug locally first
3. Check workflow logs for specific errors
4. Ask for help if stuck (link workflow run URL)

---

## Frontend screenshots (build artifacts)

Aby wygenerować screenshot landing page po buildzie lokalnie:

```bash
cd frontend-v2
npm install
npm run build
npm run screenshot:landing
```

Skrypt uruchamia `next start` na porcie 3011 i zapisuje obraz do:

```
frontend-v2/artifacts/build-screenshots/landing.png
```

W razie potrzeby ustaw `LANDING_SCREENSHOT_PORT`, aby użyć innego portu.

---

## Maintenance

### Monthly Tasks
- Review and merge Dependabot PRs
- Check Security tab for new vulnerabilities
- Review E2E test coverage
- Update documentation if workflows change

### Quarterly Tasks
- Review workflow efficiency (check durations)
- Update action versions if needed
- Review and archive old workflow artifacts
- Audit secrets and environment variables

---

## Support

For issues or questions about workflows:
1. Check this documentation first
2. Review workflow logs and error messages
3. Try running tests locally
4. Check GitHub Actions status page
5. Create an issue with workflow run URL

---

**Last Updated**: January 2026
**Maintainer**: DevOps Team
