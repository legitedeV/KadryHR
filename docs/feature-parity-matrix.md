# Feature Parity Matrix

This document tracks the implementation status of features across the KadryHR application.

## Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Dyspozycje - edycja wysłanej przez pracownika | ✅ Done | Gdy okno otwarte |
| Avatar upload (multipart) | ✅ Done | Employees & Organisation logo |
| Grafik-v2 - styling | ✅ Done | Dopasowany do design system |
| Grafik-v2 - integracja API | ✅ Done | Realne dane z backendu |
| Grafik-v2 - filtr lokalizacji | ✅ Done | Dropdown w headerze |

## Authentication & Authorization

| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ Done | Email/password authentication |
| Register | ✅ Done | Owner registration |
| Password reset | ✅ Done | Request and confirm flow |
| Role-based access | ✅ Done | OWNER, MANAGER, EMPLOYEE, ADMIN |
| JWT tokens | ✅ Done | Access token with refresh |

## Employee Management

| Feature | Status | Notes |
|---------|--------|-------|
| List employees | ✅ Done | Pagination and filtering |
| Employee details | ✅ Done | Full profile view |
| Avatar upload | ✅ Done | Multipart/form-data upload |
| Avatar delete | ✅ Done | Remove employee avatar |
| Employee search | ✅ Done | By name, email, position |
| Employee status | ✅ Done | Active/inactive filtering |

## Schedule Management

| Feature | Status | Notes |
|---------|--------|-------|
| Grafik v1 | ✅ Done | Weekly view with shifts |
| Grafik v2 | ✅ Done | Monthly calendar view |
| Shift creation | ✅ Done | Manual shift entry |
| Shift presets | ✅ Done | Predefined shift templates |
| Location filtering | ✅ Done | Filter by location |
| Drag & drop shifts | ⚠️ Partial | Visual in progress |
| Copy previous week | ✅ Done | Bulk copy shifts |
| Publish schedule | ✅ Done | Notify employees |
| Clear week | ✅ Done | Bulk delete shifts |

## Availability Management

| Feature | Status | Notes |
|---------|--------|-------|
| Availability windows | ✅ Done | Manager creates windows |
| Employee submission | ✅ Done | Submit availability |
| Manager review | ✅ Done | Approve/review submissions |
| Weekly patterns | ✅ Done | Recurring availability |
| Window notifications | 🔄 In Progress | Email notifications |

## Profile & Settings

| Feature | Status | Notes |
|---------|--------|-------|
| User profile | ✅ Done | View and edit profile |
| Change password | ✅ Done | Secure password update |
| Change email | ✅ Done | With password confirmation |
| Avatar upload | ✅ Done | User profile picture |
| Organisation settings | 🔄 In Progress | Logo and branding |

## Locations

| Feature | Status | Notes |
|---------|--------|-------|
| List locations | ✅ Done | All organisation locations |
| Location details | ✅ Done | Name, address, employees |
| Create location | ✅ Done | Add new locations |
| Edit location | ✅ Done | Update location info |
| Delete location | 🔄 In Progress | Soft delete |

## Schedule Templates

| Feature | Status | Notes |
|---------|--------|-------|
| List templates | ✅ Done | View all templates |
| Create from week | ✅ Done | Save week as template |
| Template details | ✅ Done | View template shifts |
| Apply template | 🔄 In Progress | Load template to week |

## Reporting & Analytics

| Feature | Status | Notes |
|---------|--------|-------|
| Hours summary | ✅ Done | Monthly hours per employee |
| Payout calculation | ✅ Done | Based on hourly rate |
| Availability stats | ✅ Done | Submission statistics |
| Export to PDF/Excel | ❌ Not Started | Scheduled reports |

---

## Legend

- ✅ **Done** - Feature is complete and working
- 🔄 **In Progress** - Feature is partially implemented
- ⚠️ **Partial** - Core functionality works, enhancements pending
- ❌ **Not Started** - Feature not yet implemented
- 🔮 **Planned** - Feature is planned for future release

---

**Last Updated:** 2026-01-20
