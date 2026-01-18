# KadryHR – Product Gap Analysis

## Executive Summary

### What do we already have?

KadryHR is a **working HR/workforce management platform** with:
- Functional self-service registration and authentication
- Weekly schedule management with full CRUD operations
- Leave request workflow with approval process
- Employee availability collection system
- Employee and location management
- Basic organisation settings

### What type of system is this?

A **B2B SaaS platform** targeting Polish retail businesses, convenience stores (e.g., Żabka franchises), and shift-based teams. It provides workforce scheduling, availability management, and leave request handling.

### Maturity level

**Late Prototype / Early MVP** — The core scheduling and request management features work, but significant gaps remain for:
- Employee self-service experience
- Time tracking (RCP)
- Payroll/hours export
- Payment processing
- Mobile optimization

### Comparison to Kadromierz / GIR Staff

| Capability | KadryHR Status | Competitor Standard |
|------------|---------------|---------------------|
| Schedule creation | ✅ Working | ✅ Standard feature |
| Drag-drop scheduling | ✅ Working | ✅ Standard feature |
| Leave requests | ✅ Working | ✅ Standard feature |
| Availability windows | ✅ Working | ✅ Standard feature |
| Employee self-portal | ⚠️ Partial | ✅ Dedicated employee app |
| Time tracking (RCP) | ❌ Missing | ✅ Core feature |
| Mobile app | ❌ Missing | ✅ iOS/Android apps |
| Payroll export | ❌ Missing | ✅ Standard feature |
| Integrations | ❌ Missing | ✅ ERP, accounting systems |
| Multi-language | ❌ Polish only | ✅ Multi-language |

### One-Screen Summary

**Strengths:**
- Clean, modern UI with dark theme
- Full schedule CRUD with templates, copy, drag-drop
- Complete leave request workflow with balances
- Sophisticated availability window system
- Self-service registration flow
- Good API design (NestJS + Prisma)

**Weaknesses:**
- No time tracking / clock-in functionality (critical for shift businesses)
- No mobile-optimized employee experience
- No payroll export or hours reporting
- Billing not functional (payment integration missing)
- Employee view shows manager's full schedule (privacy concern)
- No contract/document management UI despite backend support

**Where we stand:**
KadryHR is approximately **40-50% complete** compared to a mature competitor. The scheduling and request management core is solid, but operational features like time tracking, reporting, and mobile access are missing.

---

## Module-by-Module Review

---

## Module: Landing Page (`/`)

**Purpose (product view)**
The landing page should clearly communicate what KadryHR does, who it's for, and why a store owner should sign up. It should drive conversions to registration.

**Current implementation**
- Routes: `frontend-v2/app/page.tsx`
- Components: `Hero`, `ProblemSolution`, `ProductTour`, `StorySection`, `FeatureGroups`, `UseCases`, `SocialProof`, `PricingSection`, `SecuritySection`, `ContactSection`, `LandingFooter`
- Data: Static content, schema.org markup for SEO

**Actions available:**
- View marketing content
- Click "Zaloguj się" → `/login`
- Click "Zarejestruj się" → `/register`
- View pricing (static display)
- Contact section (placeholder form)

**Visible UI issues:**
- Contact form doesn't actually submit
- "Umów demo" buttons don't do anything
- Social proof section has placeholder testimonials

**Status classification:** Partially usable (marketing-ready, not conversion-optimized)

**Gaps / Missing pieces**
- Contact form not wired to backend
- No demo booking calendar integration
- No live chat widget
- No blog / knowledge base
- No case studies with real data
- No integration badges (Żabka partner, etc.)

**Recommendations**
- [P2] Wire contact form to email or CRM
- [P2] Add live chat (e.g., Intercom, Crisp)
- [P3] Create blog section for SEO
- [P3] Add demo booking with Calendly

**Related backend modules**
- `backend-v2/src/leads/` — for contact form leads
- `backend-v2/src/newsletter/` — for newsletter signups

---

## Module: Authentication (`/login`, `/register`)

**Purpose (product view)**
Secure access for existing users, easy onboarding for new organisations.

**Current implementation**
- Login: `frontend-v2/app/login/page.tsx`
- Register: `frontend-v2/app/register/page.tsx`
- Auth context: `frontend-v2/lib/auth-context.tsx`
- Backend: `backend-v2/src/auth/auth.controller.ts`

**Actions available:**
- Login with email/password
- Register new organisation with owner account
- Redirect handling for protected routes

**Status classification:** Partially usable

**Gaps / Missing pieces**
- No "Forgot password" flow (link exists, no page)
- No email verification on registration
- No 2FA setup in UI (backend supports TOTP)
- No OAuth/social login
- No terms/privacy checkbox on registration
- No CAPTCHA protection

**Recommendations**
- [P0] Implement password reset flow
- [P1] Add email verification
- [P1] Implement 2FA setup UI
- [P2] Add terms/privacy checkbox
- [P2] Add rate limiting / CAPTCHA

**Related backend modules**
- `backend-v2/src/auth/auth.service.ts`
- Password reset endpoint exists but no UI

---

## Module: Dashboard (`/panel/dashboard`)

**Purpose (product view)**
Quick overview of today's schedule, team status, and pending actions. Should answer: "What do I need to know right now?"

**Current implementation**
- Route: `frontend-v2/app/panel/dashboard/page.tsx`
- Data: Current week shifts, employees, pending requests, approved leaves

**Actions available:**
- View today's shifts
- View employees by status (tabs)
- View work hours chart
- See pending requests (links to requests page)

**Status classification:** Read-only prototype

**Gaps / Missing pieces**
- "Accept/Reject" buttons on requests don't work inline (just links)
- No alerts for scheduling conflicts
- No understaffing warnings
- No upcoming deadlines (availability windows closing, etc.)
- No labor cost overview
- No comparison vs. planned hours
- Employee view should be different (show "my shifts today")

**Recommendations**
- [P1] Make request approve/reject actions work inline
- [P1] Add schedule conflict alerts
- [P1] Differentiate employee vs manager dashboard
- [P2] Add labor cost/budget tracking
- [P2] Add upcoming deadlines widget

**Related backend modules**
- `backend-v2/src/shifts/shifts.service.ts`
- `backend-v2/src/leave-requests/leave-requests.service.ts`

---

## Module: Grafik / Schedule (`/panel/grafik`)

**Purpose (product view)**
Weekly schedule builder for managers. Assign employees to shifts, manage coverage, publish schedule to notify team.

**Current implementation**
- Route: `frontend-v2/app/panel/grafik/page.tsx`
- Components: `ScheduleGrid`, `ScheduleHeader`, `ShiftEditorModal`, `TemplatesDialog`, etc.
- Data: Shifts, employees, locations, availability, approved leaves, shift presets

**Actions available:**
- ✅ Navigate weeks (prev/next/today)
- ✅ Filter by location
- ✅ Create shift (modal)
- ✅ Edit shift (modal)
- ✅ Delete shift
- ✅ Drag-and-drop to reassign
- ✅ Save as template
- ✅ Apply template
- ✅ Copy previous week
- ✅ Clear week
- ✅ Publish schedule (notify employees)
- ✅ See availability indicators
- ✅ See approved leave overlays
- ✅ Override availability with reason

**Status classification:** Production-ready (for manager view)

**Gaps / Missing pieces**
- No monthly view option
- No employee self-view (employees see manager's full grid)
- No conflict detection (overlapping shifts for same employee)
- No auto-scheduling / suggestions
- No export to PDF/Excel
- No print-friendly view
- No mobile-optimized view
- No shift swap request flow
- No open shift claiming

**Recommendations**
- [P0] Create employee self-view (show only their shifts)
- [P0] Add conflict detection for overlapping shifts
- [P1] Add monthly view
- [P1] Add PDF/Excel export
- [P2] Add auto-scheduling suggestions
- [P2] Add shift swap workflow

**Related backend modules**
- `backend-v2/src/shifts/shifts.controller.ts`
- `backend-v2/src/schedule-templates/`
- `backend-v2/src/shift-presets/`

---

## Module: Pracownicy / Employees (`/panel/pracownicy`)

**Purpose (product view)**
Manage team members: add, edit, deactivate employees. Assign to locations.

**Current implementation**
- Route: `frontend-v2/app/panel/pracownicy/page.tsx`
- Data: Employees with locations

**Actions available:**
- ✅ View employees in grid
- ✅ Filter by status
- ✅ Create employee (sends invitation)
- ✅ Edit employee
- ✅ Upload/delete avatar
- ✅ Resend invitation
- ✅ Deactivate / activate
- ✅ Delete (soft delete)
- ✅ Assign to locations

**Status classification:** Partially usable

**Gaps / Missing pieces**
- No bulk import (CSV/Excel)
- No employee detail/profile page
- No employment contract management UI (backend has model)
- No compensation/salary view UI (backend has model)
- No document management UI (backend has model)
- "On leave" count is hardcoded to 0
- No search by name
- No role/permission assignment per employee

**Recommendations**
- [P0] Add employee detail page with tabs (profile, contracts, documents, history)
- [P1] Create contract management UI
- [P1] Add CSV/Excel import
- [P2] Add compensation tracking UI
- [P2] Add document upload UI

**Related backend modules**
- `backend-v2/src/employees/employees.controller.ts`
- `backend-v2/src/contracts/` — contracts exist but no UI
- `backend-v2/src/documents/` — documents exist but no UI

---

## Module: Wnioski / Leave Requests (`/panel/wnioski`)

**Purpose (product view)**
Leave request submission and approval workflow. Track leave balances.

**Current implementation**
- Route: `frontend-v2/app/panel/wnioski/page.tsx`
- Data: Requests, leave types, employees, balances, history

**Actions available:**
- ✅ View requests with filters
- ✅ Create new request
- ✅ Edit pending request
- ✅ Approve / reject / cancel
- ✅ View leave balances
- ✅ View request history

**Status classification:** Partially usable

**Gaps / Missing pieces**
- No file attachments (medical certificates)
- No half-day leave support
- No manager notes/comments visible to employee
- No calendar export (iCal, Google Calendar)
- No automatic balance preview before submit
- No delegation handling
- No mobile-friendly submission

**Recommendations**
- [P1] Add file attachments
- [P1] Add half-day leave option
- [P2] Add manager comments
- [P2] Add calendar integration
- [P2] Add balance preview on create form

**Related backend modules**
- `backend-v2/src/leave-requests/leave-requests.controller.ts`
- `backend-v2/src/leave-types/leave-types.controller.ts`

---

## Module: Dyspozycje / Availability (`/panel/dyspozycje`)

**Purpose (product view)**
Collect employee availability before building schedules. Allow managers to review and track completion.

**Current implementation**
- Route: `frontend-v2/app/panel/dyspozycje/page.tsx`
- Data: Availability windows, submissions, team stats

**Actions available:**
- ✅ View active availability window
- ✅ Submit my availability (monthly calendar)
- ✅ Use shift preset quick buttons
- ✅ Mark days off
- ✅ Save draft / submit
- ✅ Create availability window (manager)
- ✅ Close window (manager)
- ✅ View team completion status
- ✅ Edit employee availability (manager)
- ✅ Update submission status (reviewed, reopened)

**Status classification:** Production-ready

**Gaps / Missing pieces**
- No recurring weekly patterns (set once for all Mondays)
- No preference ranking (e.g., prefer mornings)
- No automatic email reminders
- No mobile-optimized view for employees
- No conflict detection with existing shifts

**Recommendations**
- [P1] Add automatic reminder emails before deadline
- [P2] Add recurring pattern support
- [P2] Add preference ranking
- [P2] Improve mobile experience

**Related backend modules**
- `backend-v2/src/availability/availability.controller.ts`

---

## Module: Lokalizacje / Locations (`/panel/lokalizacje`)

**Purpose (product view)**
Manage store locations and branch assignments.

**Current implementation**
- Route: `frontend-v2/app/panel/lokalizacje/page.tsx` (client component in `LokalizacjeClient.tsx`)
- Data: Locations with assigned employees

**Actions available:**
- ✅ View location cards
- ✅ Search by name/address
- ✅ Create location
- ✅ Edit location
- ✅ Delete location
- ✅ Assign employees

**Status classification:** Production-ready

**Gaps / Missing pieces**
- No map view
- No address geocoding
- No location-specific settings (operating hours, capacity)
- No location hierarchy (regions)

**Recommendations**
- [P2] Add Google Maps integration
- [P3] Add operating hours configuration
- [P3] Add location hierarchy

**Related backend modules**
- `backend-v2/src/locations/locations.controller.ts`

---

## Module: Organizacja / Organisation Settings (`/panel/organizacja`)

**Purpose (product view)**
Configure organisation settings: branding, schedule rules, team roles.

**Current implementation**
- Route: `frontend-v2/app/panel/organizacja/page.tsx`
- Data: Organisation details, members, role descriptions

**Actions available:**
- ✅ Edit name, description, category
- ✅ Upload/delete logo
- ✅ Configure delivery days (Żabka feature)
- ✅ Configure promotion cycle
- ✅ View members
- ✅ Change member roles (owner only)

**Status classification:** Partially usable

**Gaps / Missing pieces**
- No notification preferences
- No timezone configuration
- No data export (GDPR)
- No audit log viewer
- No API key management
- No custom leave type management shortcut
- No integration settings

**Recommendations**
- [P1] Add notification preferences
- [P1] Add audit log viewer (admin)
- [P2] Add GDPR data export
- [P2] Add custom leave type management

**Related backend modules**
- `backend-v2/src/organisations/organisations.controller.ts`
- `backend-v2/src/audit/` — audit logs exist but no UI

---

## Module: Rozliczenia / Billing (`/panel/rozliczenia`)

**Purpose (product view)**
Manage subscription, view invoices, upgrade plans.

**Current implementation**
- Route: `frontend-v2/app/panel/rozliczenia/page.tsx`
- Data: Current subscription status

**Actions available:**
- ✅ View current plan
- ✅ View trial end date
- ✅ View plan options (disabled buttons)

**Status classification:** Read-only prototype

**Gaps / Missing pieces**
- **No payment integration** (Stripe, etc.)
- No actual plan upgrade flow
- No invoice history
- No billing contact management
- No usage metrics (employees vs plan limit)
- No coupon/discount handling

**Recommendations**
- [P0] Integrate Stripe for payments
- [P0] Implement plan upgrade flow
- [P1] Add invoice history
- [P1] Add usage dashboard

**Related backend modules**
- `backend-v2/src/subscriptions/subscriptions.controller.ts`

---

## Module: Time Tracking / RCP (NOT IMPLEMENTED)

**Purpose (product view)**
Clock in/out functionality to track actual hours worked vs. planned schedule.

**Current implementation**
- **No UI exists**
- Backend models reference shifts and could support time entries
- No `TimeEntry` or `ClockEvent` model in schema

**Status classification:** Not implemented

**Gaps / Missing pieces**
- No clock-in/out endpoints
- No time entry UI
- No comparison view (planned vs actual)
- No late/early alerts
- No overtime calculation
- No break tracking

**Recommendations**
- [P0] Design time entry data model
- [P0] Create clock-in/out API
- [P0] Build employee clock-in UI (mobile-first)
- [P1] Build manager time review UI
- [P1] Add overtime calculation
- [P2] Add geolocation verification

---

## Module: Reports / Export (LIMITED)

**Purpose (product view)**
Export hours worked, generate payroll reports, analyze scheduling efficiency.

**Current implementation**
- Backend: `backend-v2/src/reports/` exists
- No UI for reports
- No export functionality exposed

**Status classification:** Not implemented (backend partial)

**Gaps / Missing pieces**
- No hours report
- No CSV/Excel export
- No payroll summary
- No labor cost analysis
- No schedule efficiency metrics

**Recommendations**
- [P0] Add hours export endpoint
- [P0] Add CSV export for shifts/hours
- [P1] Add payroll summary report
- [P2] Add dashboard analytics

**Related backend modules**
- `backend-v2/src/reports/`
- `backend-v2/src/payroll/`

---

## Customer Journey – End-to-End Review

### 1. First Contact (Landing)

**What exists:**
- Marketing landing page at `/`
- Clear value proposition sections
- Pricing overview
- CTAs to login/register

**What's missing:**
- Contact form doesn't work
- No demo booking
- No live chat

**Friction points:**
- Can't actually contact sales
- No social proof with real customer names

---

### 2. Sign-up / Login

**What exists:**
- Self-service registration at `/register`
- Creates organisation + owner in one step
- Login works with email/password

**What's missing:**
- No email verification
- No password reset
- No 2FA setup

**Friction points:**
- If user forgets password, no recovery option
- No confirmation that account was created (just redirect)

---

### 3. First Organisation & Locations

**What exists:**
- Organisation settings at `/panel/organizacja`
- Can add locations at `/panel/lokalizacje`

**What's missing:**
- No onboarding wizard
- No setup checklist
- No sample data option

**Friction points:**
- User lands on empty dashboard with no guidance
- Must know to go to settings first

---

### 4. Add Employees

**What exists:**
- Employee creation at `/panel/pracownicy`
- Invitation email sent
- Location assignment

**What's missing:**
- No bulk import
- No onboarding checklist for employees
- No employee self-registration link

**Friction points:**
- Must add employees one by one
- No visibility into invitation status

---

### 5. Build First Schedule

**What exists:**
- Weekly schedule view at `/panel/grafik`
- Shift creation modal
- Drag-drop assignment

**What's missing:**
- No schedule wizard for first-time users
- No auto-fill suggestions
- No templates from industry

**Friction points:**
- Steep learning curve for first schedule
- No help text explaining features

---

### 6. Handle Availability & Requests

**What exists:**
- Availability windows at `/panel/dyspozycje`
- Leave requests at `/panel/wnioski`
- Approval workflow

**What's missing:**
- Employees can't easily submit from mobile
- No automatic reminders

**Friction points:**
- Manager must create availability window first
- Employees must know to check the system

---

### 7. Time Tracking & Hours

**What exists:**
- Nothing in UI

**What's missing:**
- Entire time tracking module
- Clock in/out
- Hours comparison

**Friction points:**
- **Complete blocker** for businesses that need to verify hours worked

---

### 8. Payroll / Exports

**What exists:**
- Nothing in UI

**What's missing:**
- Hours export
- Payroll summary
- CSV/Excel download

**Friction points:**
- **Complete blocker** for monthly payroll processing

---

### 9. Billing & Subscription

**What exists:**
- Read-only subscription view
- Plan options displayed

**What's missing:**
- Actual payment processing
- Plan upgrade flow

**Friction points:**
- **Complete blocker** for monetization
- Users can't upgrade or pay

---

### 10. Employee View / Mobile

**What exists:**
- Employees can login with same UI
- See full schedule grid (privacy concern)
- Submit availability and requests

**What's missing:**
- Dedicated employee portal
- Mobile-optimized views
- Push notifications
- "My shifts" focused view

**Friction points:**
- Employees see manager's full view
- Poor mobile experience

---

## Prioritized Roadmap – What's Missing to Reach "Final Product"

### Phase 1 – Critical Gaps (MVP+)

**Must have for any paying customer:**

- [P0] **Password Reset Flow**
  - UI at `/forgot-password`
  - Backend email with reset link
  - Reset confirmation page
  - *Files:* Create `frontend-v2/app/forgot-password/page.tsx`, `frontend-v2/app/reset-password/page.tsx`

- [P0] **Employee Self-View for Schedule**
  - Employees should see only their shifts
  - Separate component or view mode in `/panel/grafik`
  - *Files:* Modify `frontend-v2/app/panel/grafik/page.tsx`

- [P0] **Shift Conflict Detection**
  - Prevent overlapping shifts for same employee
  - Show warning in shift editor
  - *Files:* `backend-v2/src/shifts/shifts.service.ts`, frontend shift modal

- [P0] **Basic Hours Export**
  - CSV download of shifts with hours
  - Filter by date range, location
  - *Files:* `backend-v2/src/reports/`, new UI component

- [P0] **Stripe Payment Integration**
  - Connect Stripe account
  - Plan selection and checkout
  - Subscription management
  - *Files:* `backend-v2/src/subscriptions/`, `frontend-v2/app/panel/rozliczenia/`

### Phase 2 – Employee Experience

- [P0] **Employee Dashboard**
  - "My shifts this week"
  - "My pending requests"
  - "My leave balance"
  - *Files:* New or conditional content in `frontend-v2/app/panel/dashboard/page.tsx`

- [P1] **Mobile-Optimized Schedule View**
  - Day-by-day scroll for employees
  - Swipe navigation
  - *Files:* New component or view mode

- [P1] **Email Verification on Registration**
  - Send verification email
  - Confirm before full access
  - *Files:* `backend-v2/src/auth/`, `frontend-v2/app/verify-email/`

- [P1] **2FA Setup UI**
  - TOTP setup flow with QR code
  - Backup codes
  - *Files:* `frontend-v2/app/panel/profil/` (new section)

### Phase 3 – Time Tracking (RCP)

- [P0] **Time Entry Data Model**
  - Add `TimeEntry` model to Prisma schema
  - Clock in/out events
  - *Files:* `backend-v2/prisma/schema.prisma`

- [P0] **Clock In/Out Endpoints**
  - `POST /time-entries/clock-in`
  - `POST /time-entries/clock-out`
  - List entries for date range
  - *Files:* New `backend-v2/src/time-entries/` module

- [P0] **Employee Clock In UI**
  - Simple clock button
  - Current status display
  - Today's hours
  - *Files:* New component in dashboard or dedicated page

- [P1] **Manager Time Review**
  - View all entries for day/week
  - Edit/correct entries
  - Compare planned vs actual
  - *Files:* New UI page

- [P1] **Overtime Calculation**
  - Define overtime rules
  - Automatic calculation
  - Alerts for approaching limits
  - *Files:* Backend service, dashboard widget

### Phase 4 – HR Management

- [P0] **Employee Detail Page**
  - Profile tab with editable info
  - Contracts tab
  - Documents tab
  - History tab
  - *Files:* `frontend-v2/app/panel/pracownicy/[id]/page.tsx`

- [P1] **Contract Management UI**
  - View/create employment contracts
  - Contract types (UoP, zlecenie, B2B)
  - *Files:* Use existing `backend-v2/src/contracts/`

- [P1] **Document Upload**
  - Upload employee documents
  - View/download
  - *Files:* Use existing `backend-v2/src/documents/`

- [P1] **Bulk Employee Import**
  - CSV/Excel upload
  - Mapping columns
  - Validation preview
  - *Files:* New endpoint + UI modal

### Phase 5 – Reporting & Analytics

- [P1] **Payroll Summary Report**
  - Hours per employee
  - Overtime breakdown
  - Export to CSV/Excel
  - *Files:* `backend-v2/src/payroll/`, new UI page

- [P1] **Schedule Analytics Dashboard**
  - Hours planned vs actual
  - Labor cost by location
  - Absence rates
  - *Files:* New dashboard widgets or page

- [P2] **Audit Log Viewer**
  - View system activity
  - Filter by user, action, date
  - *Files:* New UI using `backend-v2/src/audit/`

### Phase 6 – Polish & Production Readiness

- [P1] **Onboarding Wizard**
  - Step-by-step setup for new organisations
  - Progress tracker
  - Skip option
  - *Files:* New component/flow

- [P1] **Error Handling & Empty States**
  - Consistent error messages
  - Helpful empty states with actions
  - Loading skeletons
  - *Files:* Across all pages

- [P2] **Email Notifications**
  - Schedule published notification
  - Leave request status change
  - Availability window reminder
  - *Files:* `backend-v2/src/notifications/`

- [P2] **In-App Notifications**
  - Notification bell with unread count
  - Notification list page
  - Mark as read
  - *Files:* New UI component

- [P2] **Help & Documentation**
  - In-app help tooltips
  - Link to knowledge base
  - *Files:* Throughout UI

---

## Technical Debt Notes

1. **"Na urlopie" count hardcoded to 0** in employees page
   - *File:* `frontend-v2/app/panel/pracownicy/page.tsx` line ~366

2. **Dashboard request buttons link instead of action**
   - *File:* `frontend-v2/app/panel/dashboard/page.tsx` lines ~510-518

3. **No error boundary wrapping**
   - Add React error boundaries to main sections

4. **API client retry logic**
   - Consider adding retry for transient failures

5. **Bundle size optimization**
   - Analyze and code-split large pages

---

## Conclusion

KadryHR has a **strong foundation** for the core scheduling and request management features. To reach production readiness for paying customers, the immediate priorities are:

1. **Password reset** — Users will forget passwords
2. **Employee self-view** — Privacy and usability
3. **Hours export** — Payroll is monthly requirement
4. **Payment integration** — Monetization blocker
5. **Time tracking** — Essential for shift businesses

With these features, KadryHR could serve its target market of Polish retail and shift-based businesses as a viable alternative to established competitors.

---

*Document generated: January 2026*
*Repository: legitedeV/KadryHR*
