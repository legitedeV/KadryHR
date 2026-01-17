# KadryHR — Backlog

## Deferred Features (from End-to-End Platform Completion - January 2026)

### Payment & Billing Integration
- Stripe/Przelewy24 integration for subscription payments
- Plan upgrade/downgrade flow with prorated billing
- Invoice generation and automated delivery
- Payment history tracking and reporting
- Automated billing reminders and dunning management

### SMS Integration
- SMSAPI.pl integration with API credentials configuration
- SMS delivery tracking, reporting, and retry logic
- SMS notification preferences per user per notification type
- Bulk SMS campaigns with scheduling
- SMS templates management and personalization

### Two-Factor Authentication (2FA)
- TOTP implementation with QR code generation using authenticator apps
- Backup codes generation, storage, and usage tracking
- 2FA enforcement policies configurable per organization
- Recovery flow for lost devices with admin verification
- Admin ability to reset user 2FA in emergency situations

### Advanced Scheduling Features
- Drag-and-drop shift assignment with real-time validation
- Copy week / paste week functionality with conflict resolution
- Shift templates application and organizational template library
- Advanced conflict detection (overlapping shifts, leave conflicts, availability mismatches)
- Print/export view with PDF generation and custom formatting
- Real-time schedule updates via WebSocket for collaborative editing

### Admin Panel Sub-Routes
- `/panel/admin/audit` - System-wide audit log with advanced filtering
- `/panel/admin/settings` - System settings, feature flags, and configurations
- Enhanced organization management tools
- Usage analytics and monitoring dashboards

---

## Original Backlog Items

# Frontend – parity follow-ups

- Automatyczne kopiowanie tygodni / szablony grafiku (wielokrotne dni, cykle) oraz masowe publikowanie kilku tygodni z obsługą kolizji i podglądem zmian.
- Udostępnienie endpointu / UI dla logów audytowych (lista z filtrami po dacie/typie akcji, stronicowanie, eksport) – backend nie eksponuje jeszcze kontrolera.
- Avatar pracownika – upload i edycja w profilu/karcie pracownika wraz z wyświetlaniem w grafiku oraz liście powiadomień.
