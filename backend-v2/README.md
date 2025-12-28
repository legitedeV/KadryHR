# KadryHR Backend v2

Modern NestJS + TypeScript + PostgreSQL + Prisma backend for KadryHR - a multi-tenant SaaS for employee scheduling.

## 🚀 Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: class-validator, class-transformer
- **Testing**: Jest

## 📋 Features

### Multi-Tenancy
- Row-based multi-tenancy with `organisationId` in all domain entities
- Single PostgreSQL database
- Automatic tenant isolation in all queries

### Authentication & Authorization
- JWT-based authentication (access + refresh tokens)
- Role-based access control (OWNER, MANAGER, EMPLOYEE)
- Guards and decorators for route protection
- Secure password hashing with bcrypt

### Core Modules
- **Organisations**: Tenant management
- **Users**: User accounts with roles
- **Employees**: Employee records
- **Locations**: Workplace locations
- **Shifts**: Shift scheduling with datetime ranges
- **Availability**: Employee availability (date-based or weekday-based)

## 🛠️ Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
Create a `.env` file in the `backend-v2` directory:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kadryhr_v2?schema=public"

# JWT Configuration
JWT_ACCESS_SECRET="your-access-secret-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"

# Application
APP_PORT=3001
NODE_ENV="development"
```

3. **Generate Prisma Client**:
```bash
npm run prisma:generate
```

4. **Run database migrations**:
```bash
npm run prisma:migrate
```

5. **Seed the database** (optional, for development):
```bash
npm run prisma:seed
```

This creates:
- Organisation: "Seed Organisation"
- Owner user: `owner@seed.local` / `ChangeMe123!`
- 3 employees (Ethan, Mia, Sofia)
- 2 locations (Main Cafe, Warehouse)
- Sample shifts and availability records

## 🏃 Running the Application

### Development mode (with watch):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm run start
```

The API will be available at `http://localhost:3001` (or the port specified in `.env`).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 🔍 Code Quality

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Format code with Prettier
npm run format
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /auth/login
Login with email and password.
```json
{
  "email": "owner@seed.local",
  "password": "ChangeMe123!"
}
```
Returns: `{ accessToken, refreshToken }`

#### POST /auth/refresh
Refresh access token using refresh token.
```json
{
  "refreshToken": "your-refresh-token"
}
```
Returns: `{ accessToken, refreshToken }`

#### GET /auth/me
Get current user information (requires authentication).

#### POST /auth/logout
Logout and invalidate refresh token (requires authentication).

### Protected Endpoints

All other endpoints require authentication via Bearer token:
```
Authorization: Bearer <access-token>
```

#### Organisations
- `GET /organisations` - Get current organisation
- `PATCH /organisations/:id` - Update organisation (OWNER only)

#### Users
- `POST /users` - Create user (OWNER, MANAGER)
- `GET /users` - List users in organisation
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
- `GET /availability` - List availability records
- `PATCH /availability/:id` - Update availability
- `DELETE /availability/:id` - Delete availability

## 🗄️ Database Schema

### Key Models

**Organisation**
- Multi-tenant root entity
- Contains name, description

**User**
- Authentication and authorization
- Linked to organisation
- Roles: OWNER, MANAGER, EMPLOYEE

**Employee**
- Employee records within organisation
- Personal information, position

**Location**
- Workplace locations
- Name, address

**Shift**
- Scheduled work shifts
- Links employee, location, datetime range

**Availability**
- Employee availability patterns
- Can be date-specific or weekday-based
- Time ranges in minutes from midnight

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files. Use `.env.example` as template.
2. **JWT Secrets**: Use strong, random secrets in production.
3. **Password Hashing**: Passwords are hashed with bcrypt (10 rounds).
4. **Refresh Tokens**: Stored as hashes in database, rotated on refresh.
5. **CORS**: Configure CORS appropriately for production.
6. **Rate Limiting**: Consider adding rate limiting for production.

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**:
   - Set strong JWT secrets
   - Configure production DATABASE_URL
   - Set NODE_ENV=production

2. **Database**:
   ```bash
   npm run prisma:migrate:deploy
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Start**:
   ```bash
   npm run start:prod
   ```

### Docker Deployment (Optional)

Create a `Dockerfile`:
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

## 📝 Development Notes

### Adding New Modules

1. Generate module:
   ```bash
   nest g module feature-name
   nest g controller feature-name
   nest g service feature-name
   ```

2. Create DTOs with validation decorators
3. Add Prisma model to `schema.prisma`
4. Run migration: `npm run prisma:migrate:dev`
5. Implement service logic with tenant isolation
6. Add guards for authorization
7. Write tests

### Prisma Commands

```bash
# Create migration
npm run prisma:migrate:dev

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed

# Reset database (dev only)
npm run prisma:reset
```

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes with clear commit messages
3. Ensure tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Create Pull Request

## 📄 License

Proprietary - KadryHR

## 🆘 Support

For issues or questions, contact the development team or create an issue in the repository.

---

**Note**: This is backend-v2, a complete rewrite. The legacy backend in `/backend` remains operational during the transition period.
