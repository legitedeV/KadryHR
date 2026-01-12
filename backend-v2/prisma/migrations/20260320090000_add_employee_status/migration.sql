-- Add employee status and employment end date fields
ALTER TABLE "Employee" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Employee" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Employee" ADD COLUMN "employmentEndDate" TIMESTAMP(3);
