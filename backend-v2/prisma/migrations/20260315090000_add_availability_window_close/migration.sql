-- Add AVAILABILITY_WINDOW_CLOSED notification type
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AVAILABILITY_WINDOW_CLOSED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add closedAt to AvailabilityWindow
ALTER TABLE "AvailabilityWindow" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "AvailabilityWindow_closedAt_idx" ON "AvailabilityWindow"("closedAt");
