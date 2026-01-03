-- Add notification enums
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('TEST', 'LEAVE_STATUS', 'SHIFT_ASSIGNMENT', 'SCHEDULE_PUBLISHED', 'SWAP_STATUS', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationCampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationRecipientStatus" AS ENUM ('PENDING', 'DELIVERED_IN_APP', 'EMAIL_SENT', 'EMAIL_FAILED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organisationId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "before" JSONB,
  "after" JSONB,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditLog_organisationId_idx" ON "AuditLog"("organisationId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organisationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "data" JSONB,
  "channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_organisationId_userId_idx" ON "Notification"("organisationId", "userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- NotificationPreference table
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organisationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "inApp" BOOLEAN NOT NULL DEFAULT true,
  "email" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreference_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "NotificationPreference_userId_type_key" UNIQUE ("userId", "type")
);

CREATE INDEX IF NOT EXISTS "NotificationPreference_organisationId_idx" ON "NotificationPreference"("organisationId");

-- NotificationDeliveryAttempt table
CREATE TABLE IF NOT EXISTS "NotificationDeliveryAttempt" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "notificationId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationDeliveryAttempt_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "NotificationDeliveryAttempt_notificationId_idx" ON "NotificationDeliveryAttempt"("notificationId");

-- NotificationCampaign table
CREATE TABLE IF NOT EXISTS "NotificationCampaign" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organisationId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "type" "NotificationType" NOT NULL DEFAULT 'CUSTOM',
  "audienceFilter" JSONB,
  "channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
  "status" "NotificationCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationCampaign_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "NotificationCampaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "NotificationCampaign_organisationId_idx" ON "NotificationCampaign"("organisationId");
CREATE INDEX IF NOT EXISTS "NotificationCampaign_createdByUserId_idx" ON "NotificationCampaign"("createdByUserId");
CREATE INDEX IF NOT EXISTS "NotificationCampaign_status_idx" ON "NotificationCampaign"("status");

-- NotificationRecipient table
CREATE TABLE IF NOT EXISTS "NotificationRecipient" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deliveredInAppAt" TIMESTAMP(3),
  "emailAttemptId" TEXT,
  "status" "NotificationRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NotificationCampaign"("id") ON DELETE CASCADE,
  CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "NotificationRecipient_campaignId_userId_key" UNIQUE ("campaignId", "userId")
);

CREATE INDEX IF NOT EXISTS "NotificationRecipient_campaignId_idx" ON "NotificationRecipient"("campaignId");
CREATE INDEX IF NOT EXISTS "NotificationRecipient_userId_idx" ON "NotificationRecipient"("userId");
CREATE INDEX IF NOT EXISTS "NotificationRecipient_status_idx" ON "NotificationRecipient"("status");
