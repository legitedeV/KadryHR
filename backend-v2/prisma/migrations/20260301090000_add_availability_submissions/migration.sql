-- Add AvailabilitySubmissionStatus enum
DO $$ BEGIN
  CREATE TYPE "AvailabilitySubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'REOPENED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add AVAILABILITY_SUBMITTED notification type
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AVAILABILITY_SUBMITTED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add availabilityWindowId to Availability
ALTER TABLE "Availability" ADD COLUMN IF NOT EXISTS "availabilityWindowId" TEXT;

-- Create AvailabilitySubmission table
CREATE TABLE IF NOT EXISTS "AvailabilitySubmission" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "windowId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "status" "AvailabilitySubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "submittedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvailabilitySubmission_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilitySubmission_windowId_employeeId_key" ON "AvailabilitySubmission"("windowId", "employeeId");
CREATE INDEX IF NOT EXISTS "AvailabilitySubmission_organisationId_idx" ON "AvailabilitySubmission"("organisationId");
CREATE INDEX IF NOT EXISTS "AvailabilitySubmission_windowId_idx" ON "AvailabilitySubmission"("windowId");
CREATE INDEX IF NOT EXISTS "AvailabilitySubmission_employeeId_idx" ON "AvailabilitySubmission"("employeeId");
CREATE INDEX IF NOT EXISTS "AvailabilitySubmission_status_idx" ON "AvailabilitySubmission"("status");

CREATE INDEX IF NOT EXISTS "Availability_availabilityWindowId_idx" ON "Availability"("availabilityWindowId");
CREATE INDEX IF NOT EXISTS "Availability_availabilityWindowId_employeeId_idx" ON "Availability"("availabilityWindowId", "employeeId");

-- Foreign keys
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_availabilityWindowId_fkey"
  FOREIGN KEY ("availabilityWindowId") REFERENCES "AvailabilityWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AvailabilitySubmission" ADD CONSTRAINT "AvailabilitySubmission_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilitySubmission" ADD CONSTRAINT "AvailabilitySubmission_windowId_fkey"
  FOREIGN KEY ("windowId") REFERENCES "AvailabilityWindow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilitySubmission" ADD CONSTRAINT "AvailabilitySubmission_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilitySubmission" ADD CONSTRAINT "AvailabilitySubmission_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AvailabilitySubmission" ADD CONSTRAINT "AvailabilitySubmission_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
