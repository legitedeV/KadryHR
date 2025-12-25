# KadryHR API V2

Modern HR Management System API built with NestJS and Fastify.

## Features

- **NestJS Framework**: Scalable and maintainable architecture
- **Fastify**: High-performance HTTP server
- **Swagger/OpenAPI**: Interactive API documentation (dev/staging only)
- **TypeScript**: Type-safe development
- **Shared Validation**: Zod schemas from @kadryhr/shared

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=3001
API_PREFIX=v2
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Health Check

```
GET /v2/health
```

Returns API health status.

### Version Information

```
GET /v2/version
```

Returns API version and environment information.

## Documentation

Swagger UI is available at `/docs` in development and staging environments:

```
http://localhost:3001/docs
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
├── health/           # Health check module
│   ├── dto/
│   ├── health.controller.ts
│   └── health.module.ts
├── version/          # Version info module
│   ├── dto/
│   ├── version.controller.ts
│   └── version.module.ts
├── app.module.ts     # Root module
└── main.ts           # Application entry point
```

## Technology Stack

- **NestJS**: 10.x
- **Fastify**: Latest
- **TypeScript**: 5.x
- **Swagger**: @nestjs/swagger
- **Validation**: Zod (via @kadryhr/shared)
