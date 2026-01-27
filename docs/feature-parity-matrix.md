# Feature Parity Matrix

This document tracks feature implementation status across backend and frontend for KadryHR.

## Panel Modules

| Module | Backend API | Frontend UI | Tests | Notes |
|--------|-------------|-------------|-------|-------|
| Dashboard | ✅ Partial | ✅ Yes | ⚠️ Smoke only | KPI endpoints, today's shifts |
| Grafik (Schedule) | ✅ Yes | ✅ Yes | ✅ Yes | Full schedule management |
| Grafik v2 | ✅ Yes | ✅ Yes | ⚠️ Basic | Enhanced schedule with presets |
| Dyspozycje (Availability) | ✅ Yes | ✅ Yes | ✅ Yes | Windows, team stats, submissions |
| **Pracownicy (Employees)** | ✅ Yes | ✅ Yes | ✅ Yes | Full CRUD, documents metadata |
| Profil | ✅ Yes | ✅ Yes | ⚠️ Basic | User profile, avatar upload |
| Urlopy (Leave) | ✅ Yes | ❌ No | ⚠️ Backend only | Leave requests, types, balances |
| Raporty (Reports) | ✅ Yes | ❌ No | ⚠️ Backend only | Export functionality |
| Lokalizacje (Locations) | ✅ Yes | ❌ No | ⚠️ Backend only | Location management |
| Ustawienia (Settings) | ✅ Partial | ❌ No | ❌ No | Organisation settings |

## Landing Page Features

| Feature | Status | Notes |
|---------|--------|-------|
| Hero Section | ✅ Complete | With demo panel preview |
| Trusted By | ✅ Complete | Company logos |
| Timeline | ✅ Complete | How it works |
| Comparison | ✅ Complete | Before/After |
| Module Map | ✅ Complete | Interactive feature grid |
| Social Proof | ✅ Complete | Testimonials |
| Personas | ✅ Complete | Target audience |
| Pricing | ✅ Complete | Plan tiers |
| FAQ | ✅ Complete | Common questions |
| Lead Form | ✅ Complete | Contact form |

## Authentication & Authorization

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Login | ✅ Yes | ✅ Yes | JWT tokens |
| Register | ✅ Yes | ✅ Yes | Owner registration |
| Password Reset | ✅ Yes | ✅ Yes | Email flow |
| RBAC | ✅ Yes | ✅ Yes | Permission-based access |
| Multi-tenant | ✅ Yes | ✅ Yes | Organisation isolation |

## Permissions Matrix

| Permission | OWNER | ADMIN | MANAGER | EMPLOYEE |
|------------|-------|-------|---------|----------|
| SCHEDULE_MANAGE | ✅ | ✅ | ✅ | ❌ |
| SCHEDULE_VIEW | ✅ | ✅ | ✅ | ✅ |
| LEAVE_APPROVE | ✅ | ✅ | ✅ | ❌ |
| LEAVE_REQUEST | ✅ | ✅ | ✅ | ✅ |
| EMPLOYEE_MANAGE | ✅ | ✅ | ✅ | ❌ |
| EMPLOYEE_VIEW | ✅ | ✅ | ✅ | ✅ |
| ORGANISATION_SETTINGS | ✅ | ❌ | ❌ | ❌ |
| AUDIT_VIEW | ✅ | ✅ | ❌ | ❌ |
| REPORTS_EXPORT | ✅ | ✅ | ❌ | ❌ |
| AVAILABILITY_MANAGE | ✅ | ✅ | ✅ | ❌ |

## UI Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| Color Contrast | ✅ Fixed | Light gray text improved (surface-500 → surface-600) |
| Keyboard Navigation | ⚠️ Partial | Some modals have focus traps |
| Screen Readers | ⚠️ Basic | Aria labels on key elements |
| Focus Indicators | ✅ Yes | Visible focus rings |
| Reduced Motion | ✅ Yes | Respects prefers-reduced-motion |

---

## Legend

- ✅ Complete / Implemented
- ⚠️ Partial / Basic
- ❌ Not implemented / Missing

---

**Last Updated**: January 2026
