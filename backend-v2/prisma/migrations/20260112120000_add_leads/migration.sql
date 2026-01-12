-- CreateEnum for LeadStatus
DO $$ BEGIN
  CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'CONTACTED', 'WON', 'LOST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable Lead
CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "headcount" INTEGER,
  "message" TEXT,
  "consentMarketing" BOOLEAN NOT NULL,
  "consentPrivacy" BOOLEAN NOT NULL,
  "utmSource" TEXT,
  "utmCampaign" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable LeadAuditLog
CREATE TABLE IF NOT EXISTS "LeadAuditLog" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "organisationId" TEXT,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LeadAuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Lead_organisationId_idx" ON "Lead"("organisationId");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead"("email");
CREATE INDEX IF NOT EXISTS "LeadAuditLog_leadId_idx" ON "LeadAuditLog"("leadId");
CREATE INDEX IF NOT EXISTS "LeadAuditLog_organisationId_idx" ON "LeadAuditLog"("organisationId");
CREATE INDEX IF NOT EXISTS "LeadAuditLog_actorUserId_idx" ON "LeadAuditLog"("actorUserId");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Lead_organisationId_fkey'
  ) THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LeadAuditLog_leadId_fkey'
  ) THEN
    ALTER TABLE "LeadAuditLog" ADD CONSTRAINT "LeadAuditLog_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LeadAuditLog_organisationId_fkey'
  ) THEN
    ALTER TABLE "LeadAuditLog" ADD CONSTRAINT "LeadAuditLog_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LeadAuditLog_actorUserId_fkey'
  ) THEN
    ALTER TABLE "LeadAuditLog" ADD CONSTRAINT "LeadAuditLog_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
