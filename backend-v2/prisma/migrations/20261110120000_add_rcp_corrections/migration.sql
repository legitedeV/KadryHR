-- CreateEnum
CREATE TYPE "RcpCorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "RcpCorrection" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedType" "RcpEventType" NOT NULL,
    "requestedHappenedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RcpCorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "managerNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RcpCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RcpCorrection_organisationId_status_idx" ON "RcpCorrection"("organisationId", "status");
CREATE INDEX "RcpCorrection_requestedByUserId_status_idx" ON "RcpCorrection"("requestedByUserId", "status");
CREATE INDEX "RcpCorrection_eventId_idx" ON "RcpCorrection"("eventId");

-- AddForeignKey
ALTER TABLE "RcpCorrection" ADD CONSTRAINT "RcpCorrection_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RcpCorrection" ADD CONSTRAINT "RcpCorrection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "RcpEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RcpCorrection" ADD CONSTRAINT "RcpCorrection_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RcpCorrection" ADD CONSTRAINT "RcpCorrection_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
