# KadryHR v2

Modern HR Management System built with TypeScript, React, and Fastify.

## Features

### Phase 1 - Foundation ✅

- **Multi-tenant Architecture** - Secure, isolated data per organization
- **Authentication & Authorization** - Email/password auth with RBAC
- **Employee Management** - Complete CRUD with positions, tags, and avatars
- **Shift Scheduling** - Visual calendar with drag-and-drop
- **Availability Requests** - Employee time-off management with approvals
- **Audit Logging** - Track all important actions
- **File Management** - Avatar uploads with MinIO/S3
- **RESTful API** - Comprehensive backend with Swagger docs

## Tech Stack

### Backend
- **Fastify** - Fast and low overhead web framework
- **TypeScript** - Type-safe development
- **Drizzle ORM** - TypeScript-first ORM for PostgreSQL
- **PostgreSQL 15** - Reliable relational database
- **Redis 7** - Session storage and caching
- **MinIO** - S3-compatible object storage
- **Zod** - Runtime type validation
- **Argon2** - Secure password hashing

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Infrastructure
- **Docker Compose** - Local development environment
- **pnpm** - Fast, disk-efficient package manager
- **GitHub Actions** - CI/CD (ready for setup)

## Quick Start

```bash
# Prerequisites: Node.js 18+, pnpm 8+, Docker

# Clone repository
git clone https://github.com/legitedeV/KadryHR.git
cd KadryHR

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start Docker services (Postgres, Redis, MinIO)
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Seed with example data
pnpm db:seed

# Start development servers (API + Web)
pnpm dev
```

Visit:
- **Landing**: http://kadryhr.localtest.me:5173
- **Panel**: http://panel.kadryhr.localtest.me:5173
- **API Docs**: http://localhost:3000/docs

**Login credentials**:
- Email: `admin@example.com`
- Password: `password123`

## Project Structure

```
KadryHR/
├── apps/
│   ├── api/          # Fastify backend
│   │   ├── src/
│   │   │   ├── db/           # Database schema & migrations
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── lib/          # Utilities (auth, minio, audit)
│   │   │   ├── middleware/   # Auth middleware
│   │   │   └── tests/        # Unit & integration tests
│   │   └── package.json
│   └── web/          # React frontend
│       ├── src/
│       │   ├── components/   # UI components
│       │   ├── routes/       # TanStack Router pages
│       │   ├── lib/          # API client & utilities
│       │   └── hooks/        # Custom React hooks
│       └── package.json
├── packages/
│   └── shared/       # Shared types & utilities
├── docs/             # Documentation
├── e2e/              # End-to-end tests
├── docker-compose.yml
└── package.json      # Root workspace config
```

## Development

```bash
# Development
pnpm dev              # Start all services
pnpm dev:api          # API only
pnpm dev:web          # Web only

# Building
pnpm build            # Build all workspaces
pnpm typecheck        # Type check all workspaces
pnpm lint             # Lint all workspaces
pnpm test             # Run all tests

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Drizzle Studio

# Code Quality
pnpm format           # Format with Prettier
```

## Documentation

- [Setup Guide](docs/setup.md) - Detailed setup instructions
- [Feature Matrix](docs/feature-parity-matrix.md) - Feature comparison
- [API Documentation](http://localhost:3000/docs) - Swagger/OpenAPI docs

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `MINIO_*` - MinIO/S3 configuration
- `SESSION_SECRET` - Session encryption key
- `COOKIE_DOMAIN` - Cookie domain for multi-subdomain auth

## License

Private - All rights reserved

## Support

For issues or questions, please contact the development team.
