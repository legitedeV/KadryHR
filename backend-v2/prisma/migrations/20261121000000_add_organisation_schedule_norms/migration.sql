-- Add missing schedule settings columns for Organisation (production-safe, idempotent)
ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "dailyWorkNormHours" INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS "weeklyWorkNormHours" INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS "holidays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
