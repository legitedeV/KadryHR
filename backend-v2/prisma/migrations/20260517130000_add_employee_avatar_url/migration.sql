-- Add avatarUrl column to Employee table
ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
