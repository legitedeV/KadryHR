# Backend v2 architecture overview

## Domain model
- **Organisation**: Tenant boundary; owns users, employees, locations, shifts and availability windows.
- **User**: Application account with role (`OWNER`, `MANAGER`, `EMPLOYEE`), optional link to an employee profile, refresh token hash for sessions.
- **Employee**: HR profile (name, contact, position) scoped to an organisation; can have shifts and availability.
- **Location**: Named workplace within an organisation; optional on shifts.
- **Shift**: Scheduled work block for an employee (start/end datetimes, optional position/notes, optional location).
- **Availability**: Employee availability windows (date-specific or weekly weekday + minute ranges).

The Prisma schema (`prisma/schema.prisma`) enforces tenant scoping with `organisationId` on every business entity and indexes on foreign keys.

## Application modules
- **Auth**: Email/password login, access + refresh JWTs, `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout`.
- **Users**: CRUD for organisation-scoped users; password hashing with bcrypt; role assignment and optional employee linking.
- **Organisations**: Read/update organisation details for the current tenant.
- **Employees**: CRUD with pagination helper; organisation-scoped filters.
- **Locations**: CRUD for organisation locations.
- **Shifts**: CRUD for scheduled shifts including employee + optional location relations.
- **Availability**: CRUD for employee availability windows with time-range validation.

## Multi-tenancy
- Every controller uses the authenticated user’s `organisationId` to scope queries.
- Prisma queries include `organisationId` filters or pre-checks before updates/deletes.
- Shared `PrismaService` (`src/prisma/prisma.service.ts`) centralises database access.

## Authentication & authorization
- Access tokens use the **JWT strategy** (`jwt`), refresh tokens use **jwt-refresh** with body-provided token.
- Guards: `JwtAuthGuard` for authentication, `JwtRefreshGuard` for refresh, `RolesGuard` + `@Roles` decorator for role-based access.
- `@CurrentUser` decorator pulls the validated JWT payload into handlers.
- Secrets/TTLs are provided via environment variables and validated with `ConfigValidationModule` + `validateEnv`.

## Request handling & validation
- Global `ValidationPipe` with whitelist + transform rejects extraneous data.
- DTOs provide field-level validation for create/update endpoints.
- Error handling uses Nest exceptions (`BadRequestException`, `NotFoundException`, etc.) surfaced via standard HTTP responses.

## Configuration & bootstrapping
- Config values loaded via `ConfigModule` using `configuration.ts`; validated against required env keys.
- Application starts in `src/main.ts` and listens on `APP_PORT` (default 3000).
- Prisma client is generated from `prisma/schema.prisma`; a seed script is available under `prisma/seed`.
