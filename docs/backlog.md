# CI/CD Backlog

This document tracks future improvements and enhancements for the CI/CD pipeline.

## Priority: High

### P1: Add Integration Tests for Backend
**Status**: Not Started  
**Estimated Effort**: 2-3 days  
**Description**: Add comprehensive integration tests for API endpoints, authentication, and database operations.  
**Dependencies**: None  
**Owner**: Backend Team  
**Notes**:
- Use Jest + Supertest
- Test against real PostgreSQL container
- Cover all CRUD operations
- Test multi-tenancy isolation

### P2: Improve E2E Test Coverage
**Status**: Not Started  
**Estimated Effort**: 1-2 weeks  
**Description**: Expand E2E tests beyond smoke tests to cover critical user journeys.  
**Dependencies**: None  
**Owner**: QA Team  
**Notes**:
- Login/logout flow
- Employee management (CRUD)
- Leave request workflow
- Calendar/schedule management
- Multi-tenant scenarios
- Admin panel features

### P3: Add Performance Testing
**Status**: Not Started  
**Estimated Effort**: 1 week  
**Description**: Add performance benchmarks and load testing to CI pipeline.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Use k6 or Artillery
- Test API response times
- Database query performance
- Concurrent user simulation
- Set performance budgets
- Run on schedule, not every PR

## Priority: Medium

### P4: Visual Regression Testing
**Status**: Not Started  
**Estimated Effort**: 3-5 days  
**Description**: Add visual regression testing for frontend components.  
**Dependencies**: None  
**Owner**: Frontend Team  
**Notes**:
- Use Playwright screenshots + Percy/Chromatic
- Test critical pages and components
- Responsive design testing
- Cross-browser compatibility

### P5: Database Migration Testing
**Status**: Not Started  
**Estimated Effort**: 2-3 days  
**Description**: Enhance Prisma validation to test migration rollback and data integrity.  
**Dependencies**: None  
**Owner**: Backend Team  
**Notes**:
- Test migration up/down
- Validate data integrity after migration
- Test schema changes on copy of production data
- Add migration performance benchmarks

### P6: Parallel E2E Test Execution
**Status**: Not Started  
**Estimated Effort**: 2-3 days  
**Description**: Split E2E tests into parallel jobs to reduce execution time.  
**Dependencies**: Improved E2E coverage (P2)  
**Owner**: DevOps Team  
**Notes**:
- Use Playwright sharding
- Split by test file or describe block
- Ensure test independence
- Combine test results

### P7: Add Docker Build and Push
**Status**: Not Started  
**Estimated Effort**: 1-2 days  
**Description**: Build and push Docker images to container registry.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Create Dockerfiles for backend and frontend
- Push to GitHub Container Registry or Docker Hub
- Tag with commit SHA and semantic version
- Use multi-stage builds for optimization

### P8: Add Lighthouse CI
**Status**: Not Started  
**Estimated Effort**: 1 day  
**Description**: Run Lighthouse audits on key pages to track performance, accessibility, and SEO.  
**Dependencies**: None  
**Owner**: Frontend Team  
**Notes**:
- Run on every PR
- Set performance budgets
- Track metrics over time
- Fail on critical issues

## Priority: Low

### P9: Add Code Coverage Reporting
**Status**: Not Started  
**Estimated Effort**: 1 day  
**Description**: Generate and publish code coverage reports.  
**Dependencies**: Integration tests (P1)  
**Owner**: Backend Team  
**Notes**:
- Use Codecov or Coveralls
- Set minimum coverage thresholds
- Track coverage trends
- Comment on PRs with coverage changes

### P10: Add Slack/Discord Notifications
**Status**: Not Started  
**Estimated Effort**: 0.5 day  
**Description**: Send CI/CD status notifications to team chat.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Notify on main branch failures
- Notify on deployment success/failure
- Include relevant links and logs
- Make configurable (don't spam)

### P11: Add Branch Protection Rules
**Status**: Not Started  
**Estimated Effort**: 0.5 day  
**Description**: Enforce required status checks and review requirements.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Require CI to pass before merge
- Require at least 1 approval
- Dismiss stale reviews on new commits
- Require linear history (optional)

### P12: Add Workflow Optimization
**Status**: Not Started  
**Estimated Effort**: 1-2 days  
**Description**: Optimize workflows for faster execution.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Cache node_modules more aggressively
- Use BuildKit for Docker builds
- Parallelize independent jobs
- Skip unchanged workspace (backend/frontend)
- Use matrix strategy where applicable

### P13: Add Staging Environment Deploy
**Status**: Not Started  
**Estimated Effort**: 1 week  
**Description**: Deploy to staging environment before production.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Deploy to staging on develop branch
- Run smoke tests against staging
- Manual approval before production deploy
- Environment parity with production

### P14: Add Database Backup Before Deploy
**Status**: Not Started  
**Estimated Effort**: 1 day  
**Description**: Automatically backup database before production deployment.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Backup PostgreSQL before deploy
- Keep last 7 backups
- Test restore procedure
- Add rollback capability

### P15: Add Changelog Generation
**Status**: Not Started  
**Estimated Effort**: 0.5 day  
**Description**: Automatically generate changelog from commits.  
**Dependencies**: None  
**Owner**: DevOps Team  
**Notes**:
- Use conventional commits
- Generate on release
- Include in release notes
- Link to relevant PRs/issues

## Completed

### ✅ Add Prisma Migration Validation
**Status**: ✅ Completed  
**Completed Date**: January 2026  
**Description**: Validate Prisma schema changes on every PR to prevent broken migrations.

### ✅ Add E2E Tests with Playwright
**Status**: ✅ Completed  
**Completed Date**: January 2026  
**Description**: Run Playwright E2E tests against full stack with PostgreSQL and Redis.

### ✅ Add Security Scanning
**Status**: ✅ Completed  
**Completed Date**: January 2026  
**Description**: NPM audit and CodeQL analysis on PRs and weekly schedule.

### ✅ Add Dependabot Configuration
**Status**: ✅ Completed  
**Completed Date**: January 2026  
**Description**: Automated dependency updates for backend, frontend, and GitHub Actions.

### ✅ Add Employee Management Panel
**Status**: ✅ Completed  
**Completed Date**: January 2026  
**Description**: Added "Pracownicy" (Employees) tab to the panel sidebar with full CRUD operations (list, add, edit, suspend/activate, delete), employee detail view with documents section, and improved contrast in landing page/panel UI.

---

## Out of Scope (for future consideration)

### Document File Storage
**Description**: The current employees page displays document metadata but doesn't include actual file upload/download functionality for production. This requires:
- Cloud storage integration (e.g., AWS S3, Azure Blob)
- File upload/download endpoints secured with RBAC
- File size limits and virus scanning
- Document versioning

### Employee Contracts Module
**Description**: Full contract management (UOP, UZ, UOD, B2B) with:
- Contract creation/editing wizard
- Contract status tracking (active, suspended, ended)
- Integration with payroll module
- Automated notifications for expiring contracts

### EMPLOYEE_DOCUMENTS_MANAGE Permission
**Description**: Currently documents use EMPLOYEE_MANAGE permission. A dedicated EMPLOYEE_DOCUMENTS_MANAGE permission could provide finer-grained access control for document operations.

---

## How to Propose New Items

1. Open an issue with label `enhancement` and `ci/cd`
2. Include:
   - Clear description of the improvement
   - Business value / benefits
   - Estimated effort
   - Any dependencies
   - Proposed priority
3. Team will review and add to backlog if approved

---

## Notes

- Priorities may shift based on business needs
- Effort estimates are rough and may change during implementation
- Dependencies should be resolved before starting work
- Items are reviewed quarterly for priority adjustments

---

**Last Updated**: January 2026
