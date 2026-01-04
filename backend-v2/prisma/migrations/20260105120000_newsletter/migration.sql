-- CreateEnum
CREATE TYPE "NewsletterSubscriptionStatus" AS ENUM ('PENDING_CONFIRMATION', 'ACTIVE', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "organisationId" TEXT,
    "status" "NewsletterSubscriptionStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterToken" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_organisationId_key" ON "NewsletterSubscriber"("email", "organisationId");

-- CreateIndex
CREATE INDEX "NewsletterToken_subscriberId_idx" ON "NewsletterToken"("subscriberId");

-- CreateIndex
CREATE INDEX "NewsletterToken_tokenHash_type_idx" ON "NewsletterToken"("tokenHash", "type");

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterToken" ADD CONSTRAINT "NewsletterToken_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
