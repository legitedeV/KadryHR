# KadryHR API V2

Modern HR Management System API built with NestJS, Fastify, PostgreSQL, Prisma, and JWT-based authentication.

## Features

- **NestJS Framework**: Scalable and maintainable architecture
- **Fastify**: High-performance HTTP server
- **PostgreSQL + Prisma**: Type-safe database access with migrations
- **Authentication & RBAC**: JWT with organization-aware memberships and roles
- **Swagger/OpenAPI**: Interactive API documentation (dev/staging only)
- **TypeScript**: Type-safe development
- **Shared Validation**: Zod schemas from @kadryhr/shared

## Getting Started

### Prerequisites
- Node.js 22+
- Docker (for local PostgreSQL)

### Environment Variables

Copy `.env.example` to `.env` inside `apps/api` and adjust if needed:

```bash
cp apps/api/.env.example apps/api/.env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string (defaults to local docker-compose database)
- `JWT_SECRET` / `JWT_EXPIRES_IN` - JWT signing configuration

### Start local PostgreSQL

Use the provided docker-compose file from the repository root:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

### Install dependencies & generate Prisma client

```bash
npm install --workspace apps/api
cd apps/api
npx prisma generate
```

### Apply database migrations

```bash
cd apps/api
npx prisma migrate dev
```

### Development

```bash
cd apps/api
npm run dev
```

### V2 test admin

Create a ready-to-login admin account (runs against the database configured in `apps/api/.env`; falls back to `.env.example` or the default docker-compose database if not set):

```bash
npm run --workspace apps/api seed:test-admin
```

Default credentials:

- Email: `admin.v2+test@kadryhr.local`
- Password: `AdminTest123!`
- Organization: `KadryHR Test Org V2`

You can override the values with environment variables before running the script:

- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`
- `TEST_ADMIN_NAME`
- `TEST_ADMIN_ORG_NAME`

### Production

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Health & Version
- `GET /v2/health`
- `GET /v2/version`

### Authentication (API V2)
- `POST /v2/auth/register` — creates User + Organization + OWNER membership, returns JWT
- `POST /v2/auth/login` — returns JWT with default organization context
- `GET /v2/auth/me` — requires `Authorization: Bearer <token>` and organization context (token `orgId` or `X-Org-Id` header); returns user profile, memberships, and active organization

## Documentation

Swagger UI is available at `/docs` in development and staging environments:

```bash
http://localhost:3002/docs
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Architecture

```
src/
├── app.module.ts      # Root module
├── auth/              # Auth module (JWT, registration, login, profile)
├── common/            # Shared guards & decorators (org context, current user)
├── health/            # Health check module
├── prisma/            # PrismaService (database access)
├── version/           # Version info module
└── main.ts            # Application entry point
prisma/
└── schema.prisma      # Database schema (User, Organization, Membership)
```

## RBAC & Multi-tenancy
- **Roles**: OWNER, ADMIN, MANAGER, EMPLOYEE
- **Org guard**: Uses `X-Org-Id` header or JWT `orgId` claim and verifies membership
- **JWT payload**: Contains user id, email, and current organization id for context-sensitive access

## Local Verification Checklist
1. Start PostgreSQL (`docker compose -f docker-compose.dev.yml up -d postgres`).
2. Copy `.env.example` to `.env` and confirm `DATABASE_URL` matches the running database.
3. Run `npm install --workspace apps/api`.
4. Run `npx prisma migrate dev` to create the schema and generate the Prisma client.
5. Start API with `npm run dev` (default port **3002**) and exercise `/v2/auth/register`, `/v2/auth/login`, and `/v2/auth/me` with a valid `X-Org-Id`.

### Running with the full dev stack

The root `docker-compose.dev.yml` can launch PostgreSQL, the NestJS API (port **3002**), the Next.js web app (port **3001**), and the legacy Vite frontend (port **3000**) behind a single Nginx proxy on `http://localhost:8080`:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Key proxy routes:

- `http://localhost:8080/schedule-builder` → Next.js V2 app (default)
- `http://localhost:8080/schedule-builder/legacy` → legacy Vite fallback
- `http://localhost:8080/api/v2/health` → NestJS API V2 health check
