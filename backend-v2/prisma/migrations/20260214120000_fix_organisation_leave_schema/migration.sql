-- Ensure organisation fields used by the panel are present
ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "deliveryDays" "Weekday"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "deliveryLabelColor" TEXT DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS "promotionCycleStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "promotionCycleFrequency" INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "category" TEXT,
ADD COLUMN IF NOT EXISTS "preventShiftOnApprovedLeave" BOOLEAN NOT NULL DEFAULT false;

-- Ensure LeaveCategory enum exists
DO $$ BEGIN
  CREATE TYPE "LeaveCategory" AS ENUM ('PAID_LEAVE', 'SICK', 'UNPAID', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure LeaveRequest.type uses the LeaveCategory enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'LeaveRequest'
      AND column_name = 'type'
      AND udt_name <> 'LeaveCategory'
  ) THEN
    ALTER TABLE "LeaveRequest"
      ALTER COLUMN "type" TYPE "LeaveCategory" USING "type"::text::"LeaveCategory";
  END IF;
END $$;

-- Create LeaveType table if missing
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

ALTER TABLE "LeaveType" ADD COLUMN IF NOT EXISTS "defaultDaysPerYear" INTEGER DEFAULT 26;

-- Create LeaveBalance table if missing
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

-- Add leaveTypeId column to LeaveRequest if it doesn't exist
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "leaveTypeId" TEXT;

-- Indexes for LeaveType
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveType_organisationId_name_key" ON "LeaveType"("organisationId", "name");
CREATE INDEX IF NOT EXISTS "LeaveType_organisationId_idx" ON "LeaveType"("organisationId");

-- Indexes for LeaveBalance
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveBalance_organisationId_employeeId_leaveTypeId_year_key" ON "LeaveBalance"("organisationId", "employeeId", "leaveTypeId", "year");
CREATE INDEX IF NOT EXISTS "LeaveBalance_organisationId_idx" ON "LeaveBalance"("organisationId");
CREATE INDEX IF NOT EXISTS "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");
CREATE INDEX IF NOT EXISTS "LeaveBalance_leaveTypeId_idx" ON "LeaveBalance"("leaveTypeId");

-- Foreign keys for LeaveType
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

-- Foreign keys for LeaveBalance
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

-- Foreign key for LeaveRequest.leaveTypeId
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
