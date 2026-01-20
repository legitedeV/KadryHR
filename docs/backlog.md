# Backlog - Out of scope for current PR

This document tracks features and enhancements that are planned but not included in the current implementation scope.

---

## Grafik-v2

### High Priority
- [ ] Export grafiku do PDF/Excel
- [ ] Bulk operations (copy week, paste to multiple employees)
- [ ] Responsive grid system to eliminate horizontal scroll on mobile
- [ ] Save changes to API when modifying cells inline
- [ ] Undo/redo persistence across page refreshes

### Medium Priority
- [ ] Drag & drop zmian między dniami (pełna implementacja z visual feedback)
- [ ] Widok Gantt chart dla zmian
- [ ] Keyboard shortcuts documentation
- [ ] Multi-select with Ctrl+Click
- [ ] Cell comments/notes feature

### Low Priority
- [ ] Powiadomienia push o zmianach w grafiku
- [ ] Integracja z kalendarzem Google/Outlook
- [ ] Conflict detection (overlapping shifts)
- [ ] Auto-fill based on availability
- [ ] Color-coded shift types visualization

---

## Avatary

### High Priority
- [ ] Crop/resize przy uploadzie (image editor)
- [ ] Client-side image validation and preview
- [ ] Better error handling with specific messages

### Medium Priority
- [ ] Generowanie miniatur różnych rozmiarów
- [ ] CDN dla statycznych plików (performance optimization)
- [ ] Bulk avatar upload for multiple employees
- [ ] Avatar history/versioning

### Low Priority
- [ ] Gravatar integration as fallback
- [ ] AI-powered avatar enhancement
- [ ] Custom avatar frames/borders

---

## Dyspozycje (Availability)

### High Priority
- [ ] Powiadomienia email gdy okno się zamyka
- [ ] Raport zbiorczy dyspozycji dla managera
- [ ] Export availability to CSV/Excel

### Medium Priority
- [ ] Bulk approve/reject dyspozycji
- [ ] Availability conflicts highlighting
- [ ] Mobile-optimized submission form
- [ ] Recurring availability patterns (e.g., "always unavailable on Mondays")

### Low Priority
- [ ] SMS notifications dla ważnych zmian
- [ ] Integration with employee personal calendars
- [ ] AI-powered schedule optimization based on availability

---

## Employee Management

### High Priority
- [ ] Advanced search and filtering
- [ ] Employee onboarding workflow
- [ ] Contract and document management
- [ ] Employee permissions and capabilities

### Medium Priority
- [ ] Employee groups and teams
- [ ] Certification and skills tracking
- [ ] Performance reviews integration
- [ ] Time-off requests and tracking

### Low Priority
- [ ] Employee directory with org chart
- [ ] Birthday and anniversary reminders
- [ ] Employee referral program tracking

---

## Locations

### High Priority
- [ ] Soft delete with recovery option
- [ ] Location-specific shift templates
- [ ] Opening hours and metadata

### Medium Priority
- [ ] Google Maps integration
- [ ] Location capacity management
- [ ] Multi-location shift assignment

### Low Priority
- [ ] Location-based automatic notifications
- [ ] Weather integration for outdoor locations
- [ ] Parking and facilities information

---

## Schedule Templates

### High Priority
- [ ] Apply template to week functionality
- [ ] Template versioning and history
- [ ] Template sharing between organisations

### Medium Priority
- [ ] Template preview before applying
- [ ] Smart template suggestions based on past schedules
- [ ] Template categories and tagging

### Low Priority
- [ ] Community template marketplace
- [ ] AI-generated templates based on business patterns
- [ ] Template performance analytics

---

## Reporting & Analytics

### High Priority
- [ ] Export reports to PDF/Excel
- [ ] Labor cost analysis
- [ ] Schedule adherence tracking
- [ ] Custom report builder

### Medium Priority
- [ ] Real-time dashboard with KPIs
- [ ] Trend analysis and forecasting
- [ ] Comparative analytics (month-over-month, year-over-year)
- [ ] Automated scheduled reports via email

### Low Priority
- [ ] Predictive analytics for staffing needs
- [ ] Machine learning for optimal shift allocation
- [ ] Integration with payroll systems
- [ ] Advanced data visualization (charts, graphs)

---

## Authentication & Security

### High Priority
- [ ] Two-factor authentication (2FA)
- [ ] Session management and timeout
- [ ] Audit logs for admin actions
- [ ] GDPR compliance tools

### Medium Priority
- [ ] Single Sign-On (SSO) integration
- [ ] IP whitelist/blacklist
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts

### Low Priority
- [ ] Biometric authentication support
- [ ] Passwordless authentication (WebAuthn)
- [ ] Security question recovery
- [ ] Advanced permission system (granular access control)

---

## Notifications

### High Priority
- [ ] Email notifications for key events
- [ ] In-app notification center
- [ ] Notification preferences per user
- [ ] Digest emails (daily/weekly summaries)

### Medium Priority
- [ ] Push notifications (web and mobile)
- [ ] SMS notifications for critical updates
- [ ] Notification templates customization
- [ ] Notification history and archive

### Low Priority
- [ ] Slack/Teams integration
- [ ] Voice call notifications for emergencies
- [ ] Notification delivery status tracking
- [ ] AI-powered notification prioritization

---

## Mobile Experience

### High Priority
- [ ] Responsive design improvements
- [ ] Mobile-optimized forms
- [ ] Touch gesture support (swipe, pinch)
- [ ] Offline mode with sync

### Medium Priority
- [ ] Native mobile app (iOS/Android)
- [ ] Mobile push notifications
- [ ] Camera integration for avatar upload
- [ ] QR code scanning for clock-in/out

### Low Priority
- [ ] Wearable device integration
- [ ] Voice commands
- [ ] Dark mode auto-switch based on time
- [ ] Haptic feedback for interactions

---

## Integration & APIs

### High Priority
- [ ] REST API documentation
- [ ] Webhook support for external systems
- [ ] Rate limiting and API keys
- [ ] API versioning strategy

### Medium Priority
- [ ] GraphQL API
- [ ] Third-party integrations (Zapier, Make)
- [ ] Export/import functionality (CSV, JSON)
- [ ] Calendar sync (iCal format)

### Low Priority
- [ ] SDK for popular languages (Python, JavaScript)
- [ ] Public API marketplace
- [ ] Real-time API with WebSockets
- [ ] Batch operations API

---

## Performance & Scalability

### High Priority
- [ ] Database query optimization
- [ ] Caching strategy implementation
- [ ] CDN setup for static assets
- [ ] Load testing and benchmarking

### Medium Priority
- [ ] Server-side pagination everywhere
- [ ] Image optimization pipeline
- [ ] Code splitting and lazy loading
- [ ] Service worker for offline support

### Low Priority
- [ ] Multi-region deployment
- [ ] Auto-scaling infrastructure
- [ ] Real-time performance monitoring
- [ ] A/B testing framework

---

## Testing & Quality

### High Priority
- [ ] E2E test coverage for critical paths
- [ ] Integration tests for API endpoints
- [ ] Visual regression testing
- [ ] Accessibility (a11y) testing

### Medium Priority
- [ ] Performance testing automation
- [ ] Security penetration testing
- [ ] Load testing scenarios
- [ ] Cross-browser compatibility tests

### Low Priority
- [ ] Mutation testing
- [ ] Chaos engineering experiments
- [ ] Fuzz testing
- [ ] Automated code review tools

---

**Last Updated:** 2026-01-20
**Priority Levels:**
- **High:** Should be addressed in next 1-2 sprints
- **Medium:** Can be addressed in 3-6 months
- **Low:** Nice to have, no specific timeline
