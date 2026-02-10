CREATE TABLE "ReportExport" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "rowCount" INTEGER NOT NULL,
  "filters" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportExport_organisationId_createdAt_idx" ON "ReportExport"("organisationId", "createdAt");
CREATE INDEX "ReportExport_createdByUserId_idx" ON "ReportExport"("createdByUserId");

ALTER TABLE "ReportExport"
  ADD CONSTRAINT "ReportExport_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReportExport"
  ADD CONSTRAINT "ReportExport_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
