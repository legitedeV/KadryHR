-- CreateEnum
CREATE TYPE "RcpRotateMode" AS ENUM ('STATIC', 'DAILY', 'HOURLY');

-- CreateEnum
CREATE TYPE "RcpEventType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

-- AlterTable
ALTER TABLE "Location" ADD COLUMN "geoLat" DECIMAL(10,7),
ADD COLUMN "geoLng" DECIMAL(10,7),
ADD COLUMN "geoRadiusMeters" INTEGER,
ADD COLUMN "rcpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rcpAccuracyMaxMeters" INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "RcpQrConfig" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "tokenTtlSeconds" INTEGER NOT NULL DEFAULT 3600,
    "rotateMode" "RcpRotateMode" NOT NULL DEFAULT 'STATIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RcpQrConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RcpEvent" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "type" "RcpEventType" NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "clientTime" TIMESTAMP(3),
    "clientLat" DECIMAL(10,7) NOT NULL,
    "clientLng" DECIMAL(10,7) NOT NULL,
    "accuracyMeters" INTEGER,
    "distanceMeters" INTEGER NOT NULL,
    "qrTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RcpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RcpQrConfig_locationId_key" ON "RcpQrConfig"("locationId");

-- CreateIndex
CREATE INDEX "RcpQrConfig_organisationId_idx" ON "RcpQrConfig"("organisationId");

-- CreateIndex
CREATE INDEX "RcpEvent_organisationId_idx" ON "RcpEvent"("organisationId");

-- CreateIndex
CREATE INDEX "RcpEvent_userId_idx" ON "RcpEvent"("userId");

-- CreateIndex
CREATE INDEX "RcpEvent_locationId_idx" ON "RcpEvent"("locationId");

-- CreateIndex
CREATE INDEX "RcpEvent_happenedAt_idx" ON "RcpEvent"("happenedAt");

-- AddForeignKey
ALTER TABLE "RcpQrConfig" ADD CONSTRAINT "RcpQrConfig_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RcpQrConfig" ADD CONSTRAINT "RcpQrConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RcpEvent" ADD CONSTRAINT "RcpEvent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RcpEvent" ADD CONSTRAINT "RcpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RcpEvent" ADD CONSTRAINT "RcpEvent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
