-- Add SMS and PUSH to NotificationChannel enum
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'SMS';
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'PUSH';

-- Add sms and push columns to NotificationPreference table
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "sms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "push" BOOLEAN NOT NULL DEFAULT false;
