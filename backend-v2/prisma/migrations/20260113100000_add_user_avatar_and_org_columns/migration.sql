-- Add avatarUrl column to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Add logoUrl and category columns to Organisation table
ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "category" TEXT;
