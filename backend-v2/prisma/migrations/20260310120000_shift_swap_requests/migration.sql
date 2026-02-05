-- CreateEnum for shift swap status
DO $$ BEGIN
  CREATE TYPE "ShiftSwapStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable ShiftSwapRequest
CREATE TABLE IF NOT EXISTS "ShiftSwapRequest" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "targetEmployeeId" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "ShiftSwapStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftSwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_organisationId_idx" ON "ShiftSwapRequest"("organisationId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_requesterId_idx" ON "ShiftSwapRequest"("requesterId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_targetEmployeeId_idx" ON "ShiftSwapRequest"("targetEmployeeId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_shiftId_idx" ON "ShiftSwapRequest"("shiftId");

-- AddForeignKey for ShiftSwapRequest to Organisation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ShiftSwapRequest_organisationId_fkey'
  ) THEN
    ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey for ShiftSwapRequest to Employee (requester)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ShiftSwapRequest_requesterId_fkey'
  ) THEN
    ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey for ShiftSwapRequest to Employee (target)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ShiftSwapRequest_targetEmployeeId_fkey'
  ) THEN
    ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_targetEmployeeId_fkey"
    FOREIGN KEY ("targetEmployeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey for ShiftSwapRequest to Shift
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ShiftSwapRequest_shiftId_fkey'
  ) THEN
    ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES "Shift"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
