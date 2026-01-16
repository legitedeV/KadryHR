-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOGO_PROPOSAL_REVIEW';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOGO_PROPOSAL_APPROVED';

-- CreateEnum
CREATE TYPE "LogoProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LogoProposalVote" AS ENUM ('APPROVE', 'NEUTRAL', 'REJECT');

-- CreateTable
CREATE TABLE "LogoProposal" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LogoProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "typography" TEXT,
    "symbol" TEXT,
    "logoSvg" TEXT NOT NULL,
    "logoConfig" JSONB,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogoProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogoProposalFeedback" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" "LogoProposalVote" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogoProposalFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogoProposal_organisationId_idx" ON "LogoProposal"("organisationId");

-- CreateIndex
CREATE INDEX "LogoProposal_status_idx" ON "LogoProposal"("status");

-- CreateIndex
CREATE INDEX "LogoProposalFeedback_organisationId_idx" ON "LogoProposalFeedback"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "LogoProposalFeedback_proposalId_userId_key" ON "LogoProposalFeedback"("proposalId", "userId");

-- AddForeignKey
ALTER TABLE "LogoProposal" ADD CONSTRAINT "LogoProposal_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoProposal" ADD CONSTRAINT "LogoProposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoProposal" ADD CONSTRAINT "LogoProposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoProposal" ADD CONSTRAINT "LogoProposal_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoProposal" ADD CONSTRAINT "LogoProposal_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoProposalFeedback" ADD CONSTRAINT "LogoProposalFeedback_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "LogoProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoProposalFeedback" ADD CONSTRAINT "LogoProposalFeedback_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoProposalFeedback" ADD CONSTRAINT "LogoProposalFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
