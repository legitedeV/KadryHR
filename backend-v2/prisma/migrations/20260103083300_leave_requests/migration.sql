-- Baseline schema + leave requests table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeaveType" AS ENUM ('PAID_LEAVE', 'SICK', 'UNPAID', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organisation
CREATE TABLE IF NOT EXISTS "Organisation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "organisationId" UUID NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "refreshTokenHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "User_organisationId_idx" ON "User"("organisationId");

-- Employee
CREATE TABLE IF NOT EXISTS "Employee" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" UUID NOT NULL,
  "userId" UUID UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "position" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Employee_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Employee_organisationId_idx" ON "Employee"("organisationId");

-- Location
CREATE TABLE IF NOT EXISTS "Location" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Location_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Location_organisationId_idx" ON "Location"("organisationId");

-- LocationAssignment
CREATE TABLE IF NOT EXISTS "LocationAssignment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocationAssignment_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "LocationAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE,
  CONSTRAINT "LocationAssignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE,
  CONSTRAINT "LocationAssignment_unique" UNIQUE ("organisationId", "employeeId", "locationId")
);
CREATE INDEX IF NOT EXISTS "LocationAssignment_organisationId_idx" ON "LocationAssignment"("organisationId");
CREATE INDEX IF NOT EXISTS "LocationAssignment_employeeId_idx" ON "LocationAssignment"("employeeId");
CREATE INDEX IF NOT EXISTS "LocationAssignment_locationId_idx" ON "LocationAssignment"("locationId");

-- Shift
CREATE TABLE IF NOT EXISTS "Shift" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "locationId" UUID,
  "position" TEXT,
  "notes" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shift_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "Shift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE,
  CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Shift_organisationId_idx" ON "Shift"("organisationId");
CREATE INDEX IF NOT EXISTS "Shift_employeeId_idx" ON "Shift"("employeeId");
CREATE INDEX IF NOT EXISTS "Shift_locationId_idx" ON "Shift"("locationId");

-- Availability
CREATE TABLE IF NOT EXISTS "Availability" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "date" TIMESTAMP(3),
  "weekday" "Weekday",
  "startMinutes" INTEGER NOT NULL,
  "endMinutes" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Availability_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "Availability_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Availability_organisationId_idx" ON "Availability"("organisationId");
CREATE INDEX IF NOT EXISTS "Availability_employeeId_idx" ON "Availability"("employeeId");

-- LeaveRequest
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "approvedByUserId" UUID,
  "type" "LeaveType" NOT NULL,
  "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "rejectionReason" TEXT,
  "attachmentUrl" TEXT,
  "decisionAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaveRequest_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE,
  CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE,
  CONSTRAINT "LeaveRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "LeaveRequest_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "LeaveRequest_organisationId_idx" ON "LeaveRequest"("organisationId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "LeaveRequest_date_idx" ON "LeaveRequest"("startDate", "endDate");
