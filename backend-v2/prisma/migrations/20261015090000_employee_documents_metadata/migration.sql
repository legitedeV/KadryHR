-- Add document metadata enums
DO $$ BEGIN
  CREATE TYPE "EmployeeDocumentType" AS ENUM ('CERTIFICATE', 'SANEPID', 'MEDICAL', 'SICK_LEAVE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmployeeDocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Rename name to title and extend metadata
ALTER TABLE "EmployeeDocument"
  RENAME COLUMN "name" TO "title";

ALTER TABLE "EmployeeDocument"
  ADD COLUMN IF NOT EXISTS "type" "EmployeeDocumentType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS "status" "EmployeeDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
