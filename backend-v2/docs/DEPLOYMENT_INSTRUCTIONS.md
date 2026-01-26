# Deployment Instructions for Database Schema Fix

## Issue Summary
The production application is experiencing database errors due to missing columns and tables:
- Missing `Organisation.deliveryDays` column
- Missing `Organisation.deliveryLabelColor` column  
- Missing `Organisation.promotionCycleStartDate` column
- Missing `Organisation.promotionCycleFrequency` column
- Missing `Shift.color` column
- Missing `AvailabilityWindow` table

## Solution
A new migration has been created: `20260107181841_add_missing_schema_elements`

This migration will add all missing database schema elements that were defined in the Prisma schema but not yet applied to the production database.

## Deployment Steps

### Option 1: Using Updated Deploy Script (Recommended)
The `deploy.sh` script has been updated to automatically run migrations before building the backend.

```bash
cd /home/deploy/apps/kadryhr-app
./deploy.sh
```

### Option 2: Manual Migration
If you need to run the migration manually:

```bash
cd /home/deploy/apps/kadryhr-app/backend-v2

# Run pending migrations
npx prisma migrate deploy

# Verify migration was applied
npx prisma migrate status

# Rebuild and restart
npm run build
pm2 restart kadryhr-backend-v2
```

## Verification

After deployment, verify that the application starts without errors:

```bash
# Check PM2 logs
pm2 logs kadryhr-backend-v2 --lines 100

# Verify no database errors
pm2 logs kadryhr-backend-v2 --err --lines 50
```

You should no longer see errors like:
- `column Organisation.deliveryDays does not exist`
- `column Shift.color does not exist`
- `table public.AvailabilityWindow does not exist`

Note: The `column User.avatarUrl does not exist` error is resolved by a separate migration (`20260113100000_add_user_avatar_and_org_columns`) that will also be applied during deployment.

## Migration Details

The migration (`20260107181841_add_missing_schema_elements`) includes:

1. **Organisation table updates:**
   - `deliveryDays`: Array of Weekday enum values (default: empty array)
   - `deliveryLabelColor`: Text field (default: '#22c55e')
   - `promotionCycleStartDate`: Nullable timestamp
   - `promotionCycleFrequency`: Integer (default: 14 days)

2. **Shift table update:**
   - `color`: Nullable text field for custom shift colors

3. **New AvailabilityWindow table:**
   - Manages time windows for employee availability submissions
   - Includes indexes on organisationId, deadline, and isOpen
   - Foreign key constraint to Organisation with CASCADE delete

## Rollback Plan

If issues occur, you can rollback by:

1. Stop the application:
   ```bash
   pm2 stop kadryhr-backend-v2
   ```

2. Restore from database backup (if available)

3. Or manually drop the added columns/table:
   ```sql
   ALTER TABLE "Organisation" 
     DROP COLUMN IF EXISTS "deliveryDays",
     DROP COLUMN IF EXISTS "deliveryLabelColor",
     DROP COLUMN IF EXISTS "promotionCycleStartDate",
     DROP COLUMN IF EXISTS "promotionCycleFrequency";
   
   ALTER TABLE "Shift" DROP COLUMN IF EXISTS "color";
   
   DROP TABLE IF EXISTS "AvailabilityWindow";
   ```

4. Checkout the previous version and redeploy

## Support

If you encounter any issues during deployment, check:
- Database connectivity (ensure DATABASE_URL is correct)
- Database user has sufficient permissions for ALTER TABLE and CREATE TABLE
- PostgreSQL version is compatible (7.x or higher recommended)
