# KadryHR Monorepo

Monorepo components:
- `frontend-v2` (Next.js)
- `backend-v2` (NestJS + Prisma)

## Dependency Updates

Dependabot is configured for:
- npm updates in `backend-v2` (weekly, Monday 06:00 UTC),
- npm updates in `frontend-v2` (weekly, Monday 06:10 UTC),
- GitHub Actions updates (weekly, Monday 06:20 UTC).

Update PRs use labels `dependencies` + `security`, with grouped minor/patch updates to reduce PR noise.
Major updates for `next`, `prisma`, `@prisma/client`, and `@nestjs/*` are deferred for controlled migrations.

## Security

Repository security checks include:
- **CodeQL** for JavaScript/TypeScript,
- **Dependabot** dependency and action updates,
- **npm audit gate** for production dependencies at HIGH/CRITICAL,
- **Trivy** filesystem scans with SARIF upload,
- **Secret scanning guard** with redacted gitleaks output.

Scan findings are available in the repository **Security** tab.
