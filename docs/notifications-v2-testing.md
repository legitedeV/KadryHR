# Notifications v2: Testing Guide

## Overview

The Notifications v2 system provides production-ready campaign management with audience targeting, multi-channel delivery (in-app + email), and comprehensive delivery tracking. This guide includes automated E2E tests and manual testing scenarios.

## Prerequisites

1. **Backend dependencies installed**:
   ```bash
   cd backend-v2
   npm install
   ```

2. **Database running**: PostgreSQL instance with connection string in `backend-v2/.env`

3. **Optional - Redis for queue**: Redis instance for email queue (gracefully degrades without it)
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. **Optional - SMTP for email**: Email server configuration
   ```env
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-password
   SMTP_FROM=noreply@yourdomain.com
   ```

## Running Tests

### Unit Tests

Run all notification tests:
```bash
cd backend-v2
npm test -- notifications
```

Run specific test suites:
```bash
# Audience resolution tests (8 tests)
npm test -- campaign.service.spec.ts

# Preference filtering tests (7 tests)
npm test -- notifications-preferences.spec.ts
```

### E2E Tests

Run end-to-end tests:
```bash
cd backend-v2
npm run test:e2e
```

The E2E test suite includes:
- **Full campaign flow**: Manager creates campaign → sends to employees → employee sees in inbox → marks read → unread count updates
- **RBAC enforcement**: Verifies that employees cannot create campaigns
- **Multi-tenancy isolation**: Verifies that users cannot access other organizations' campaigns

**Test execution time**: ~5-10 seconds (depending on database speed)

### All Tests

Run unit + E2E tests:
```bash
cd backend-v2
npm test && npm run test:e2e
```

## Manual Testing Scenarios

### Scenario 1: Create and Send a Campaign (Manager)

1. **Login as Manager**:
   - Email: `manager@example.com`
   - Password: `ChangeMe123!` (or your seeded password)

2. **Navigate to Notifications**:
   - Go to `/panel/powiadomienia`
   - Click "Wyślij powiadomienie" button

3. **Create Campaign**:
   - Fill in title: "Team Meeting Tomorrow"
   - Fill in body: "Please attend the team meeting at 10 AM"
   - Select channels: IN_APP, EMAIL
   - Select audience: 
     - Option A: Check "Wszyscy w organizacji" for all users
     - Option B: Select specific roles (Pracownicy)
     - Option C: Select specific locations from dropdown
     - Option D: Select specific employees from list
   - Click "Pokaż podgląd" to preview
   - Click "Zapisz szkic" (Save draft)
   - Click "Wyślij powiadomienie" (Send notification)
   - Confirm in modal

4. **Verify Campaign Sent**:
   - You should see a success toast
   - Navigate to "Historia" to see the campaign in the list
   - Click on the campaign to see details and delivery stats

### Scenario 2: Receive and Read Notification (Employee)

1. **Login as Employee**:
   - Email: `employee@example.com`
   - Password: `ChangeMe123!`

2. **Check Notifications**:
   - Navigate to `/panel/powiadomienia`
   - You should see the notification in the Inbox tab
   - The unread count badge should be visible in the navigation

3. **Read Notification**:
   - Click "Oznacz jako przeczytane" on the notification
   - The notification should be marked as read
   - The unread count should decrease

### Scenario 3: Configure Notification Preferences (Any User)

1. **Navigate to Preferences**:
   - Go to `/panel/powiadomienia`
   - Click the "Preferencje" tab

2. **Modify Preferences**:
   - Toggle checkboxes for "Aplikacja" (In-App) and "Email" for different notification types
   - Click "Zapisz" (Save)
   - Verify success toast appears

3. **Test Preference Filtering**:
   - Have a manager send a notification
   - Verify you only receive it on channels you've enabled for that type

### Scenario 4: Targeted Audience (Manager)

1. **Login as Manager**

2. **Create Campaign with Role Filter**:
   - Navigate to `/panel/powiadomienia/wyslij`
   - Uncheck "Wszyscy w organizacji"
   - Select "Pracownicy" (Employees) role
   - Fill in notification details
   - Send the campaign

3. **Create Campaign with Location Filter**:
   - Uncheck "Wszyscy w organizacji"
   - Check locations from the "Wybierz lokalizacje" list
   - Send the campaign
   - Only employees assigned to those locations receive it

4. **Create Campaign with Specific Employees**:
   - Uncheck "Wszyscy w organizacji"
   - Check specific employees from the "Wybierz pracowników" list
   - Send the campaign
   - Only selected employees receive it

### Scenario 5: Campaign History and Delivery Stats

1. **Login as Manager**

2. **View Campaign List**:
   - Navigate to `/panel/powiadomienia/historia`
   - You should see all campaigns with status badges
   - Filter by status: "Wysłane" (Sent)

3. **View Campaign Details**:
   - Click on a campaign
   - Verify delivery statistics:
     - Total recipients
     - Delivered in-app count
     - Email sent count
     - Email failed count
   - Scroll through recipient list to see individual delivery status

### Scenario 6: System Triggers

**Schedule Publish Notification**:
1. Login as Manager
2. Create shifts for employees
3. Call the publish endpoint:
   ```bash
   POST /shifts/publish-schedule
   {
     "employeeIds": ["emp-1", "emp-2"],
     "dateRange": {
       "from": "2026-01-05",
       "to": "2026-01-12"
     }
   }
   ```
4. Affected employees receive SCHEDULE_PUBLISHED notifications

**Shift Assignment Notifications**:
1. When a shift is created, the assigned employee receives a SHIFT_ASSIGNMENT notification
2. When a shift is updated (time or employee changed), a notification is sent

**Leave Request Notifications**:
1. When manager approves/rejects leave request, employee receives LEAVE_STATUS notification

## API Testing with cURL

### Create a Campaign

```bash
# Login first to get JWT token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"ChangeMe123!"}' \
  | jq -r '.accessToken')

# Create campaign
curl -X POST http://localhost:3000/notifications/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Notification",
    "body": "This is a test from the API",
    "channels": ["IN_APP"],
    "audienceFilter": {"all": true}
  }'
```

### Send Campaign

```bash
# Replace CAMPAIGN_ID with actual ID from previous response
CAMPAIGN_ID="campaign-id-here"

curl -X POST "http://localhost:3000/notifications/campaigns/$CAMPAIGN_ID/send" \
  -H "Authorization: Bearer $TOKEN"
```

### List Campaigns

```bash
curl -X GET "http://localhost:3000/notifications/campaigns?take=10&status=SENT" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Campaign Details

```bash
curl -X GET "http://localhost:3000/notifications/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Verification Checklist

- [ ] Backend builds without errors
- [ ] All 15+ unit tests pass
- [ ] All 3 E2E tests pass
- [ ] Database migrations run successfully
- [ ] Manager can create campaigns
- [ ] Manager can target by roles, locations, and employees
- [ ] Manager can send campaigns to different audiences
- [ ] Employees receive notifications
- [ ] Employees can mark notifications as read
- [ ] Notification preferences work correctly
- [ ] Campaign history displays correctly
- [ ] Campaign details show delivery stats
- [ ] System triggers work (schedule publish, shift assignment, leave status)
- [ ] Email delivery works (if SMTP configured)
- [ ] Queue system works (if Redis configured)
- [ ] System gracefully degrades without Redis
- [ ] Audit logs are created for campaign actions
- [ ] RBAC enforced (only managers/owners can create campaigns)
- [ ] Multi-tenant isolation works (users only see their org's data)

## Troubleshooting

### E2E Tests Fail

**Cause**: Database not properly configured or test data conflicts.

**Solution**:
- Ensure DATABASE_URL is set in `.env`
- Tests create and clean up their own data
- Run tests with `--runInBand` flag to avoid parallel execution issues

### "Queue not available" warnings

**Cause**: Redis is not running or not configured.

**Solution**: Either start Redis or ignore - the system works synchronously without it.

### "Email adapter not configured" errors

**Cause**: SMTP settings are not configured in `.env`.

**Solution**: Add SMTP configuration or disable email channel in campaigns.

### Notifications not appearing

**Causes**:
- User has disabled all channels in preferences
- Campaign audience doesn't include the user
- Multi-tenant isolation (user is in different org)

**Solution**: Check preferences, verify audience targeting, and ensure correct organisation.

## Support

For issues or questions:
1. Check backend logs: `npm run dev` shows detailed logging
2. Check browser console for frontend errors
3. Verify database state with Prisma Studio: `npx prisma studio`
4. Review audit logs for campaign operations
5. Run E2E tests to verify system health: `npm run test:e2e`
