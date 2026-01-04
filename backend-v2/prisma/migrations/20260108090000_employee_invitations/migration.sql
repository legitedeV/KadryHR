-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "EmployeeInvitation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + interval '24 hours'),
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeInvitation_organisationId_idx" ON "EmployeeInvitation"("organisationId");
CREATE INDEX "EmployeeInvitation_employeeId_idx" ON "EmployeeInvitation"("employeeId");
CREATE INDEX "EmployeeInvitation_tokenHash_idx" ON "EmployeeInvitation"("tokenHash");
CREATE INDEX "EmployeeInvitation_status_idx" ON "EmployeeInvitation"("status");

-- AddForeignKey
ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger to keep updatedAt in sync
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_employee_invitation_updated_at
BEFORE UPDATE ON "EmployeeInvitation"
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
