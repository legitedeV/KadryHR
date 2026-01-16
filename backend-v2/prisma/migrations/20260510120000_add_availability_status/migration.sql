-- Add AvailabilityStatus enum and status column to Availability
DO $$
BEGIN
  CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'DAY_OFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Availability"
  ADD COLUMN IF NOT EXISTS "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';

UPDATE "Availability"
SET "status" = 'AVAILABLE'
WHERE "status" IS NULL;
