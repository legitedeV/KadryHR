-- CreateTable
CREATE TABLE "NewsletterAuditLog" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "organisationId" TEXT,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsletterAuditLog_subscriberId_idx" ON "NewsletterAuditLog"("subscriberId");

-- CreateIndex
CREATE INDEX "NewsletterAuditLog_organisationId_idx" ON "NewsletterAuditLog"("organisationId");

-- AddForeignKey
ALTER TABLE "NewsletterAuditLog" ADD CONSTRAINT "NewsletterAuditLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAuditLog" ADD CONSTRAINT "NewsletterAuditLog_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
