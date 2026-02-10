# OrganisationModuleGuard runtime fix log

- Confirmed root cause in `backend-v2/src/rcp/rcp.controller.ts`: decorators referenced `OrganisationModuleGuard` and `RequireOrganisationModule` without imports.
- Confirmed additional missing import: `ConfigService` used in constructor without import.
- Confirmed `backend-v2/src/rcp/rcp.module.ts` already registers `OrganisationModuleGuard` in providers.
- Checked usages in `rcp`, `leave-requests`, `reports`, and `availability`; only `rcp.controller.ts` had missing imports.
- Verified no circular dependency in guard: `OrganisationModuleGuard` depends on `Reflector` + `PrismaService`, not feature modules.
- Built backend successfully.
- Could not run `pm2 restart kadryhr-api` in this environment (pm2 unavailable).
- Could not complete external smoke request due to proxy/connect 502 in this environment.
