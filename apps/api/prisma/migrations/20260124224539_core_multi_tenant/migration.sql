-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'B2B', 'CIVIL_CONTRACT');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('PLANNED', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TimeEntryType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END');

-- CreateEnum
CREATE TYPE "TimeEntrySource" AS ENUM ('WEB', 'MOBILE', 'KIOSK', 'QR');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;
ALTER TABLE "Organization" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Warsaw';
ALTER TABLE "Organization" ADD COLUMN "weekStart" TEXT NOT NULL DEFAULT 'MONDAY';
ALTER TABLE "Organization" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'pl-PL';
ALTER TABLE "Organization" ADD COLUMN "industry" TEXT NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "MembershipRole" NOT NULL DEFAULT 'EMPLOYEE',
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- Backfill memberships from existing users
INSERT INTO "Membership" ("id", "createdAt", "role", "userId", "organizationId")
SELECT
  md5(random()::text || clock_timestamp()::text || "id"),
  CURRENT_TIMESTAMP,
  ("role"::text)::"MembershipRole",
  "id",
  "organizationId"
FROM "User"
WHERE "organizationId" IS NOT NULL;

-- Backfill organization slugs for existing rows
UPDATE "Organization"
SET "slug" = CONCAT(
  COALESCE(
    NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'))), ''),
    'org'
  ),
  '-',
  SUBSTRING("id" FROM 1 FOR 8)
)
WHERE "slug" IS NULL;

ALTER TABLE "Organization" ALTER COLUMN "slug" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- DropIndex
DROP INDEX "User_organizationId_idx";

-- DropIndex
DROP INDEX "Employee_userId_key";

-- DropIndex
DROP INDEX "Employee_userId_idx";

-- DropIndex
DROP INDEX "Employee_organizationId_employeeCode_key";

-- DropIndex
DROP INDEX "TimeEntry_organizationId_clockIn_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationId",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN "city" TEXT,
ADD COLUMN "code" TEXT,
ADD COLUMN "timezone" TEXT;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "employeeCode",
DROP COLUMN "userId",
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN "externalCode" TEXT,
ADD COLUMN "locationId" TEXT,
ADD COLUMN "phone" TEXT;

ALTER TABLE "Employee" ALTER COLUMN "employmentType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "published",
ADD COLUMN "breakMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "note" TEXT,
DROP COLUMN "status",
ADD COLUMN "status" "ShiftStatus" NOT NULL DEFAULT 'PLANNED';

-- AlterTable
ALTER TABLE "TimeEntry" RENAME COLUMN "source" TO "sourceLegacy";
ALTER TABLE "TimeEntry" ADD COLUMN "timestamp" TIMESTAMP(3);
ALTER TABLE "TimeEntry" ADD COLUMN "type" "TimeEntryType";
ALTER TABLE "TimeEntry" ADD COLUMN "source" "TimeEntrySource";

-- Backfill time entry data (clock-in rows)
UPDATE "TimeEntry"
SET "timestamp" = "clockIn",
    "type" = 'CLOCK_IN',
    "source" = CASE
      WHEN "sourceLegacy" ILIKE '%mobile%' THEN 'MOBILE'::"TimeEntrySource"
      WHEN "sourceLegacy" ILIKE '%kiosk%' THEN 'KIOSK'::"TimeEntrySource"
      WHEN "sourceLegacy" ILIKE '%qr%' THEN 'QR'::"TimeEntrySource"
      ELSE 'WEB'::"TimeEntrySource"
    END
WHERE "clockIn" IS NOT NULL;

-- Backfill time entry data (clock-out rows)
INSERT INTO "TimeEntry" ("id", "organizationId", "employeeId", "type", "timestamp", "source", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || "id"),
  "organizationId",
  "employeeId",
  'CLOCK_OUT',
  "clockOut",
  CASE
    WHEN "sourceLegacy" ILIKE '%mobile%' THEN 'MOBILE'::"TimeEntrySource"
    WHEN "sourceLegacy" ILIKE '%kiosk%' THEN 'KIOSK'::"TimeEntrySource"
    WHEN "sourceLegacy" ILIKE '%qr%' THEN 'QR'::"TimeEntrySource"
    ELSE 'WEB'::"TimeEntrySource"
  END,
  "createdAt"
FROM "TimeEntry"
WHERE "clockOut" IS NOT NULL;

ALTER TABLE "TimeEntry" ALTER COLUMN "timestamp" SET NOT NULL;
ALTER TABLE "TimeEntry" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "TimeEntry" ALTER COLUMN "source" SET NOT NULL;

ALTER TABLE "TimeEntry" DROP COLUMN "clockIn",
DROP COLUMN "clockOut",
DROP COLUMN "updatedAt",
DROP COLUMN "sourceLegacy";

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_organizationId_code_key" ON "Location"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Employee_locationId_idx" ON "Employee"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_externalCode_key" ON "Employee"("organizationId", "externalCode");

-- CreateIndex
CREATE INDEX "TimeEntry_organizationId_timestamp_idx" ON "TimeEntry"("organizationId", "timestamp");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
