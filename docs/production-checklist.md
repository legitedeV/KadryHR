# Production Checklist

This checklist captures the remaining production tasks and provides concrete implementation guidance.

## Google OAuth

- [ ] Create a Google Cloud OAuth client and configure approved redirect URIs for the KadryHR domains.
- [ ] Add required env vars:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
- [ ] Implement OAuth flow on the API (`/auth/google`, `/auth/google/callback`) and persist provider accounts.
- [ ] Add frontend login button and callback handling.

## Email Service (Password Recovery)

- [ ] Choose provider (SES, Mailgun, Postmark).
- [ ] Add SMTP/API credentials to env:
  - `EMAIL_PROVIDER`
  - `EMAIL_FROM`
  - `EMAIL_API_KEY` or SMTP vars
- [ ] Store password reset tokens with expiry in DB.
- [ ] Send email with recovery link.

## CI/CD Pipeline

- [ ] Add GitHub Actions workflow for lint/typecheck/build/test.
- [ ] Add Docker image build + publish (if using registry).
- [ ] Add deploy job (SSH or runner on VPS).
- [ ] Configure environment secrets in GitHub.

## Backup Strategy

- [ ] Automate PostgreSQL backups (daily + retention).
- [ ] Back up MinIO/S3 bucket.
- [ ] Store backups off-site (S3/Backblaze).
- [ ] Document restore procedure and test quarterly.

## Monitoring & Logging

- [ ] Add application logging (structured JSON).
- [ ] Add APM/metrics (Grafana + Prometheus or hosted).
- [ ] Add alerting (Slack/email on error rate, latency, disk usage).

## Security Review

- [ ] Audit dependency vulnerabilities (pnpm audit / Snyk).
- [ ] Verify tenant isolation in API queries.
- [ ] Confirm secure headers and cookie flags.
- [ ] Review admin/owner permission boundaries.

## SSL/TLS Certificates

- [ ] Configure Nginx with Let’s Encrypt.
- [ ] Force HTTPS and HSTS.
- [ ] Auto-renew certs and monitor expiration.
