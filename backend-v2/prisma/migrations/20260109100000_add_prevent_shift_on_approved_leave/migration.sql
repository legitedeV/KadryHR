-- Add preventShiftOnApprovedLeave column to Organisation
ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "preventShiftOnApprovedLeave" BOOLEAN NOT NULL DEFAULT false;
