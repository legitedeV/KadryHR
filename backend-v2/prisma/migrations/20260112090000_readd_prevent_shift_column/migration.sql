-- Ensure preventShiftOnApprovedLeave column exists on Organisation
ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "preventShiftOnApprovedLeave" BOOLEAN NOT NULL DEFAULT false;
