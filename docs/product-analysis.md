# KadryHR Product Analysis - Comparison with Industry Leaders

**Date:** December 27, 2025  
**Analyst:** Senior Full-Stack Developer  
**Scope:** Schedule Builder & Shift Management Module

---

## Executive Summary

This document analyzes KadryHR's schedule management system against industry-leading workforce management platforms (Deputy, When I Work, Planday, Homebase) to identify gaps, anti-patterns, and opportunities for improvement.

**Key Findings:**
- ✅ **Strong foundation**: Good data models (ShiftAssignment, ShiftTemplate, Schedule)
- ⚠️ **Code duplication**: Multiple schedule builder versions (V1, V2, V2Enhanced)
- ❌ **Anti-pattern**: "Quick templates" fill notes instead of setting actual shift times
- ❌ **Incomplete workflows**: Draft/Published status exists but not fully implemented in UI
- ⚠️ **Multi-tenant gaps**: Organization field exists but not consistently enforced
- ⚠️ **UX issues**: Modal scrolling, layout problems, confusing "Note Type" field

---

## 1. Competitive Analysis

### 1.1 Deputy (Market Leader)

**Shift Model:**
- Start/end times with timezone support
- Break management (paid/unpaid, auto-calculated)
- Position/role assignment
- Location/department/cost center
- Status workflow: Draft → Published → In Progress → Completed
- Conflict detection (overlapping shifts, leave conflicts)

**Workflow:**
- Draft mode with auto-save
- Publish action locks schedule (with change tracking after publish)
- Bulk operations: Copy week, apply template, mass delete
- Drag & drop with smart conflict warnings

**Multi-tenant:**
- Strict organization isolation at database level
- Role-based permissions (Owner, Admin, Manager, Employee)
- Location-based access control

### 1.2 When I Work

**Shift Model:**
- Similar to Deputy
- Strong focus on employee availability integration
- Shift swap/trade workflow
- Open shifts (unassigned, employees can claim)

**Workflow:**
- Template-based scheduling (recurring patterns)
- Auto-scheduling based on availability + demand
- Mobile-first notifications

### 1.3 Planday

**Shift Model:**
- European focus (compliance with EU labor laws)
- Break rules enforcement (mandatory breaks after X hours)
- Overtime tracking and approval workflow
- Integration with payroll

**Workflow:**
- Advanced forecasting (sales data → staffing needs)
- Budget tracking (planned vs actual labor costs)
- Shift bidding system

### 1.4 Homebase

**Shift Model:**
- SMB-focused (simpler than Deputy)
- Time clock integration
- Shift notes for tasks/instructions

**Workflow:**
- Simple publish/unpublish
- Employee self-service (view schedule, request time off)
- Basic conflict detection

---

## 2. KadryHR Current State Analysis

### 2.1 Data Models ✅ GOOD

**ShiftAssignment Model:**
```javascript
{
  schedule: ObjectId,
  employee: ObjectId,
  date: Date,
  type: 'shift' | 'leave' | 'off' | 'sick' | 'holiday',
  startTime: String, // "HH:MM"
  endTime: String,
  shiftTemplate: ObjectId,
  breaks: [{ startTime, duration, isPaid, type }],
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled',
  isOvertime: Boolean,
  overtimeApproved: Boolean,
  notes: String,
  color: String
}
```

**Assessment:**
- ✅ Comprehensive break management
- ✅ Overtime tracking
- ✅ Status workflow
- ✅ Virtual fields for duration calculations
- ⚠️ Missing: `organization` field for multi-tenant isolation
- ⚠️ Missing: `location`, `department`, `position` fields

**ShiftTemplate Model:**
```javascript
{
  name: String,
  startTime: String,
  endTime: String,
  color: String,
  type: 'morning' | 'afternoon' | 'evening' | 'night' | 'custom',
  company: ObjectId, // ✅ Multi-tenant field
  breaks: [{ startTime, duration, isPaid }],
  requiredSkills: [String],
  locationId: ObjectId,
  departmentId: ObjectId,
  allowOvertime: Boolean
}
```

**Assessment:**
- ✅ Excellent template system
- ✅ Break inheritance
- ✅ Skills/certifications support
- ✅ Location/department support
- ✅ Multi-tenant via `company` field

**Schedule Model:**
```javascript
{
  name: String,
  month: String, // "YYYY-MM"
  year: Number,
  teamId: ObjectId,
  status: 'draft' | 'published' | 'archived',
  createdBy: ObjectId,
  publishedAt: Date,
  publishedBy: ObjectId
}
```

**Assessment:**
- ✅ Status workflow defined
- ⚠️ Missing: `organization` field
- ⚠️ Missing: `startDate`, `endDate` (more flexible than month/year)

### 2.2 Frontend Issues ❌ NEEDS WORK

**Problem 1: Code Duplication**
- Three schedule builder versions:
  - `/schedule-builder` (ScheduleBuilder.jsx)
  - `/schedule-builder-v2` (ScheduleBuilderV2.jsx)
  - `/schedule-builder-enhanced` (ScheduleBuilderV2Enhanced.jsx)
- Maintenance nightmare
- Confusing for users and developers

**Problem 2: "Quick Templates" Anti-Pattern**

Current implementation in ScheduleBuilderV2.jsx:
```javascript
const quickTemplates = [
  { label: 'I zmiana', value: '05:45 - 15:00' },
  { label: 'II zmiana', value: '15:00 - 23:00' },
  { label: 'Dostawa', value: 'Dostawa' }
];

// When selected, it fills the NOTES field, not the shift times!
setFormData({ ...formData, notes: template.value });
```

**Why this is wrong:**
- Templates should set `startTime` and `endTime`, not notes
- "05:45 - 15:00" is shift data, not a note
- Breaks the data model (times stored as text in notes)
- Makes reporting/analytics impossible
- Doesn't leverage ShiftTemplate model

**Correct approach (like Deputy/When I Work):**
```javascript
// 1. Load ShiftTemplate from database
const template = await ShiftTemplate.findById(templateId);

// 2. Apply template data to form
setFormData({
  ...formData,
  startTime: template.startTime,
  endTime: template.endTime,
  breaks: template.breaks,
  shiftTemplate: template._id,
  notes: template.description || '' // Optional default note
});
```

**Problem 3: Modal UX Issues**
- Modal doesn't fit viewport on smaller screens
- Scrolling issues (page scrolls instead of modal content)
- No body scroll lock when modal is open
- "Note Type" dropdown is confusing (not standard in industry)
- Quick templates section takes too much space

**Problem 4: Incomplete Workflow Implementation**
- Schedule has `status: 'draft' | 'published' | 'archived'`
- But UI doesn't show status or "Publish Schedule" button
- No visual indication of published vs draft
- No change tracking after publish

### 2.3 Backend Issues ⚠️ NEEDS IMPROVEMENT

**Problem 1: Multi-Tenant Enforcement**
- `ShiftAssignment` model missing `organization` field
- Controllers don't consistently filter by organization
- Risk of data leakage between tenants

**Problem 2: No Service Layer**
- Business logic mixed in controllers
- Hard to test
- Code duplication

**Problem 3: No Validation Layer**
- No input validation with Zod/Joi
- Validation scattered in models and controllers

**Problem 4: No Conflict Detection**
- No endpoint to check for overlapping shifts
- No integration with leave requests
- No availability checking

---

## 3. Recommended Changes

### 3.1 Immediate (High Priority)

1. **Remove `/schedule-builder-enhanced`**
   - Delete ScheduleBuilderV2Enhanced.jsx
   - Remove route from App.jsx
   - Consolidate to single `/schedule-builder` (use V2 as base)

2. **Fix "Quick Templates" Anti-Pattern**
   - Load ShiftTemplate entities from database
   - Apply template to set startTime/endTime/breaks
   - Keep notes field separate for actual notes

3. **Fix Modal UX**
   - Add `max-height: calc(100vh - 4rem)`
   - Implement body scroll lock
   - Make content scrollable, not entire page
   - Remove confusing "Note Type" field
   - Improve layout and spacing

4. **Add Multi-Tenant Middleware**
   - Create `withTenant` middleware
   - Add `organization` field to ShiftAssignment and Schedule
   - Enforce organization filtering in all queries

### 3.2 Short-Term (Medium Priority)

5. **Implement Publish Workflow in UI**
   - Add status badge to schedule header
   - Add "Publish Schedule" button
   - Show confirmation dialog
   - Track changes after publish

6. **Add Conflict Detection**
   - Backend endpoint: `POST /api/schedule/validate`
   - Check overlapping shifts
   - Check leave conflicts
   - Show warnings in UI

7. **Add Service Layer**
   - Create `services/scheduleService.js`
   - Move business logic from controllers
   - Add unit tests

8. **Add Validation with Zod**
   - Create `validators/shiftValidators.js`
   - Validate all inputs
   - Return structured errors

### 3.3 Long-Term (Nice to Have)

9. **Bulk Operations**
   - Copy week
   - Apply template to multiple days
   - Mass delete

10. **Drag & Drop Improvements**
    - Drag shift to different day
    - Drag shift to different employee
    - Copy with Ctrl+drag

11. **Integration with Other Modules**
    - Block shifts on approved leaves
    - Show planned vs actual hours (time tracking)
    - Assign tasks to shifts

12. **Advanced Features**
    - Auto-scheduling based on availability
    - Shift swap/trade workflow
    - Open shifts
    - Budget tracking

---

## 4. Comparison Matrix

| Feature | Deputy | When I Work | Planday | Homebase | KadryHR Current | KadryHR Target |
|---------|--------|-------------|---------|----------|-----------------|----------------|
| **Data Model** |
| Shift start/end times | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Break management | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Shift templates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Status workflow | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| Overtime tracking | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Location/department | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| **Workflow** |
| Draft/publish | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Conflict detection | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| Bulk operations | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| Drag & drop | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| **Multi-Tenant** |
| Organization isolation | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Role-based permissions | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Location filtering | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| **Code Quality** |
| Service layer | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Input validation | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Unit tests | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| No code duplication | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented
- ❌ Not implemented

---

## 5. Conclusion

KadryHR has a **solid foundation** with good data models, but suffers from:
1. **Code duplication** (3 schedule builders)
2. **Anti-patterns** (quick templates filling notes)
3. **Incomplete workflows** (publish not in UI)
4. **Multi-tenant gaps** (inconsistent enforcement)
5. **UX issues** (modal scrolling, confusing fields)

The recommended changes will bring KadryHR to **production-grade quality** comparable to Deputy and When I Work, making it a competitive SaaS product.

**Estimated effort:**
- Immediate changes: 2-3 days
- Short-term changes: 1 week
- Long-term changes: 2-3 weeks

**Priority:** Focus on immediate and short-term changes first to eliminate technical debt and improve core UX.
