-- Add new notification type
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOGO_PROPOSAL_APPROVED';

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_organisationId_role_permission_key" ON "RolePermission"("organisationId", "role", "permission");

-- CreateIndex
CREATE INDEX "RolePermission_organisationId_idx" ON "RolePermission"("organisationId");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
