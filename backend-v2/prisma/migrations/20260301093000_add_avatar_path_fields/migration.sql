-- Add avatarPath columns for file-based avatars
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "avatarPath" TEXT;

ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "avatarPath" TEXT;
