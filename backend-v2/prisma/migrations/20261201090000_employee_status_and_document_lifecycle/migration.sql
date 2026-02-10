DO $$ BEGIN
  CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "Employee"
SET "status" = CASE
  WHEN "isDeleted" = true THEN 'ARCHIVED'::"EmployeeStatus"
  WHEN "isActive" = false THEN 'SUSPENDED'::"EmployeeStatus"
  ELSE 'ACTIVE'::"EmployeeStatus"
END
WHERE "status" = 'ACTIVE'::"EmployeeStatus";

ALTER TYPE "EmployeeDocumentStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

UPDATE "EmployeeDocument"
SET "status" = 'EXPIRED'::"EmployeeDocumentStatus"
WHERE "status" = 'ARCHIVED'::"EmployeeDocumentStatus";
