-- CreateEnum for LeaveCategory (rename from old LeaveType enum)
DO $$ BEGIN
  CREATE TYPE "LeaveCategory" AS ENUM ('PAID_LEAVE', 'SICK', 'UNPAID', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Rename column type in LeaveRequest from LeaveType enum to LeaveCategory enum
-- First, we need to alter the column type
ALTER TABLE "LeaveRequest" 
  ALTER COLUMN "type" TYPE "LeaveCategory" USING "type"::text::"LeaveCategory";

-- Drop the old LeaveType enum if it exists and is not being used
-- Note: This must be done after converting all columns
DO $$ BEGIN
  DROP TYPE IF EXISTS "LeaveType";
EXCEPTION
  WHEN others THEN null;
END $$;

-- CreateTable LeaveType (the model, not enum)
CREATE TABLE IF NOT EXISTS "LeaveType" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" "LeaveCategory",
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultDaysPerYear" INTEGER DEFAULT 26,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- Ensure defaultDaysPerYear column exists (for cases where table was created without it)
ALTER TABLE "LeaveType" ADD COLUMN IF NOT EXISTS "defaultDaysPerYear" INTEGER DEFAULT 26;

-- CreateTable LeaveBalance
CREATE TABLE IF NOT EXISTS "LeaveBalance" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "adjustment" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for LeaveType
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveType_organisationId_name_key" ON "LeaveType"("organisationId", "name");
CREATE INDEX IF NOT EXISTS "LeaveType_organisationId_idx" ON "LeaveType"("organisationId");

-- CreateIndex for LeaveBalance
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveBalance_organisationId_employeeId_leaveTypeId_year_key" ON "LeaveBalance"("organisationId", "employeeId", "leaveTypeId", "year");
CREATE INDEX IF NOT EXISTS "LeaveBalance_organisationId_idx" ON "LeaveBalance"("organisationId");
CREATE INDEX IF NOT EXISTS "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");
CREATE INDEX IF NOT EXISTS "LeaveBalance_leaveTypeId_idx" ON "LeaveBalance"("leaveTypeId");

-- Add leaveTypeId column to LeaveRequest if it doesn't exist
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "leaveTypeId" TEXT;

-- AddForeignKey for LeaveType
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'LeaveType_organisationId_fkey'
  ) THEN
    ALTER TABLE "LeaveType" ADD CONSTRAINT "LeaveType_organisationId_fkey" 
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey for LeaveBalance to Organisation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'LeaveBalance_organisationId_fkey'
  ) THEN
    ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_organisationId_fkey" 
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey for LeaveBalance to Employee
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'LeaveBalance_employeeId_fkey'
  ) THEN
    ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" 
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey for LeaveBalance to LeaveType
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'LeaveBalance_leaveTypeId_fkey'
  ) THEN
    ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" 
    FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey for LeaveRequest to LeaveType
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'LeaveRequest_leaveTypeId_fkey'
  ) THEN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" 
    FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
