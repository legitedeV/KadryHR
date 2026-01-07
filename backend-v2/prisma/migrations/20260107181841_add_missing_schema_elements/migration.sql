-- Add missing columns to Organisation table for Task 4.4 and 4.5
-- deliveryDays: Array of weekdays for delivery scheduling
-- deliveryLabelColor: Color for delivery labels (default green)
-- promotionCycleStartDate: Starting date for promotion cycles
-- promotionCycleFrequency: Frequency of promotion cycles in days (default 14)
ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "deliveryDays" "Weekday"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "deliveryLabelColor" TEXT DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS "promotionCycleStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "promotionCycleFrequency" INTEGER DEFAULT 14;

-- Add color column to Shift table for Task 4.2
-- Allows customization of shift appearance in the schedule
ALTER TABLE "Shift"
ADD COLUMN IF NOT EXISTS "color" TEXT;

-- Create AvailabilityWindow table for Task 4.3
-- Manages time windows for employees to submit their availability
CREATE TABLE IF NOT EXISTS "AvailabilityWindow" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Składanie dyspozycji',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- Create indexes for AvailabilityWindow
CREATE INDEX IF NOT EXISTS "AvailabilityWindow_organisationId_idx" ON "AvailabilityWindow"("organisationId");
CREATE INDEX IF NOT EXISTS "AvailabilityWindow_deadline_idx" ON "AvailabilityWindow"("deadline");
CREATE INDEX IF NOT EXISTS "AvailabilityWindow_isOpen_idx" ON "AvailabilityWindow"("isOpen");

-- Add foreign key constraint for AvailabilityWindow
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'AvailabilityWindow_organisationId_fkey'
  ) THEN
    ALTER TABLE "AvailabilityWindow" 
    ADD CONSTRAINT "AvailabilityWindow_organisationId_fkey" 
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
