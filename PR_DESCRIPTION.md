# 🚀 Backend v2: Complete NestJS + TypeScript + PostgreSQL + Prisma Implementation

## 📋 Overview

This PR introduces **backend-v2**, a complete rewrite of the KadryHR backend using modern technologies and best practices. The new backend is production-ready and provides a solid foundation for future web and mobile applications.

## ✨ Key Features

### Architecture
- **Multi-tenant SaaS**: Row-based multi-tenancy with `organisationId` in all domain entities
- **Single PostgreSQL database**: Efficient tenant isolation at the row level
- **Clean NestJS architecture**: Modular design with clear separation of concerns

### Authentication & Authorization
- **JWT-based authentication**: Access tokens (15min) + Refresh tokens (7 days)
- **Role-based access control**: OWNER, MANAGER, EMPLOYEE roles
- **Secure password handling**: bcrypt hashing with 10 rounds
- **Token rotation**: Refresh tokens are rotated and hashed in database

### Core Domain Modules
1. **Organisations**: Tenant management
2. **Users**: User accounts with roles and authentication
3. **Employees**: Employee records within organisations
4. **Locations**: Workplace locations
5. **Shifts**: Shift scheduling with datetime ranges
6. **Availability**: Employee availability (date-based or weekday-based)

### Technical Stack
- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Validation**: class-validator, class-transformer
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier

## 🔧 What's Included

### Source Code
- ✅ Complete NestJS application structure
- ✅ Prisma schema with all domain models
- ✅ Database migrations
- ✅ Seed script for development data
- ✅ DTOs with validation decorators
- ✅ Guards and decorators for authorization
- ✅ Error handling and filters
- ✅ Unit tests (3 test suites, 6 tests - all passing)

### Configuration
- ✅ Environment variable validation
- ✅ TypeScript configuration
- ✅ ESLint and Prettier setup
- ✅ Jest configuration
- ✅ Prisma configuration

### Documentation
- ✅ Comprehensive README.md with:
  - Setup instructions
  - API documentation
  - Database schema overview
  - Deployment guide
  - Security best practices
  - Development workflow

### CI/CD
- ✅ Updated GitHub Actions workflow
- ✅ Automated linting, building, and testing
- ✅ Separate job for backend-v2 (doesn't interfere with legacy backend)

## 🏃 How to Run Locally

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm

### Setup Steps

1. **Navigate to backend-v2**:
```bash
cd backend-v2
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kadryhr_v2?schema=public"
JWT_ACCESS_SECRET="your-access-secret-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
APP_PORT=3001
NODE_ENV="development"
```

4. **Generate Prisma Client**:
```bash
npm run prisma:generate
```

5. **Run migrations**:
```bash
npm run prisma:migrate
```

6. **Seed database** (optional):
```bash
npm run prisma:seed
```

This creates:
- Organisation: "Seed Organisation"
- Owner user: `owner@seed.local` / `ChangeMe123!`
- 3 employees, 2 locations, sample shifts and availability

7. **Start development server**:
```bash
npm run dev
```

API will be available at `http://localhost:3001`

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build
npm run build
```

## 🚀 Production Deployment

### Environment Setup

1. **Set production environment variables**:
```env
DATABASE_URL="postgresql://user:password@production-host:5432/kadryhr_v2?schema=public"
JWT_ACCESS_SECRET="<strong-random-secret>"
JWT_REFRESH_SECRET="<strong-random-secret>"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
APP_PORT=3001
NODE_ENV="production"
```

2. **Run migrations**:
```bash
cd backend-v2
npm ci --only=production
npx prisma generate
npx prisma migrate deploy
```

3. **Build and start**:
```bash
npm run build
npm run start:prod
```

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

Build and run:
```bash
docker build -t kadryhr-backend-v2 .
docker run -p 3001:3001 --env-file .env kadryhr-backend-v2
```

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout and invalidate refresh token

### Protected Endpoints (require Bearer token)

#### Organisations
- `GET /organisations` - Get current organisation
- `PATCH /organisations/:id` - Update organisation (OWNER only)

#### Users
- `POST /users` - Create user (OWNER, MANAGER)
- `GET /users` - List users
- `PATCH /users/:id` - Update user (OWNER, MANAGER)
- `DELETE /users/:id` - Delete user (OWNER only)

#### Employees
- `POST /employees` - Create employee
- `GET /employees` - List employees
- `PATCH /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

#### Locations
- `POST /locations` - Create location
- `GET /locations` - List locations
- `PATCH /locations/:id` - Update location
- `DELETE /locations/:id` - Delete location

#### Shifts
- `POST /shifts` - Create shift
- `GET /shifts` - List shifts
- `PATCH /shifts/:id` - Update shift
- `DELETE /shifts/:id` - Delete shift

#### Availability
- `POST /availability` - Create availability
- `GET /availability` - List availability
- `PATCH /availability/:id` - Update availability
- `DELETE /availability/:id` - Delete availability

## 🔐 Security Considerations

1. **JWT Secrets**: Use strong, random secrets in production (minimum 32 characters)
2. **Database**: Use SSL/TLS for database connections in production
3. **CORS**: Configure CORS appropriately for your frontend domains
4. **Rate Limiting**: Consider adding rate limiting middleware for production
5. **Helmet**: Consider adding Helmet.js for security headers
6. **Environment Variables**: Never commit `.env` files (use `.env.example` as template)

## 🧪 Testing & Quality

- ✅ All tests passing (3 test suites, 6 tests)
- ✅ Build successful with no TypeScript errors
- ✅ ESLint passing with no warnings
- ✅ Code formatted with Prettier

## 📝 Important Notes

### Legacy Backend
- The existing backend in `/backend` remains **untouched**
- Both backends can run simultaneously on different ports
- No breaking changes to existing functionality
- Migration strategy can be planned separately

### Database
- Uses standard Prisma client from `@prisma/client`
- Generated Prisma files are **not** committed (added to `.gitignore`)
- Migrations are version-controlled in `prisma/migrations/`

### Future Enhancements
- [ ] Add rate limiting middleware
- [ ] Add Helmet.js for security headers
- [ ] Add Swagger/OpenAPI documentation
- [ ] Add more comprehensive integration tests
- [ ] Add database connection pooling configuration
- [ ] Add logging with Winston or Pino
- [ ] Add health check endpoints
- [ ] Add metrics and monitoring

## 🎯 Migration Strategy (Future)

When ready to migrate from legacy backend:

1. **Data Migration**: Create scripts to migrate data from legacy DB to new schema
2. **API Compatibility**: Add compatibility layer if needed
3. **Gradual Rollout**: Use feature flags to gradually switch to new backend
4. **Monitoring**: Monitor both backends during transition
5. **Deprecation**: Deprecate legacy endpoints after successful migration

## ✅ Checklist

- [x] NestJS application structure
- [x] Prisma schema and migrations
- [x] Authentication (JWT with refresh tokens)
- [x] Authorization (role-based guards)
- [x] All core modules implemented
- [x] DTOs with validation
- [x] Error handling
- [x] Unit tests
- [x] Linting and formatting
- [x] README documentation
- [x] GitHub Actions CI/CD
- [x] Environment configuration
- [x] Seed script for development
- [x] Build successful
- [x] All tests passing

## 🤝 Review Notes

Please review:
1. **Architecture**: Is the multi-tenant design appropriate?
2. **Security**: Are there any security concerns?
3. **API Design**: Are the endpoints RESTful and intuitive?
4. **Documentation**: Is the README clear and comprehensive?
5. **Testing**: Do we need more test coverage?

## 📞 Questions?

If you have any questions about the implementation, deployment, or architecture decisions, please comment on this PR or reach out directly.

---

**Ready to merge**: This PR is production-ready and can be merged to `main` when approved. The new backend can be deployed alongside the legacy backend without any conflicts.
