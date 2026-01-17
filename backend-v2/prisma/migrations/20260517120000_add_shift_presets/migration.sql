-- CreateTable
CREATE TABLE "ShiftPreset" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "color" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftPreset_organisationId_idx" ON "ShiftPreset"("organisationId");

-- CreateIndex
CREATE INDEX "ShiftPreset_isActive_idx" ON "ShiftPreset"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftPreset_organisationId_code_key" ON "ShiftPreset"("organisationId", "code");

-- AddForeignKey
ALTER TABLE "ShiftPreset" ADD CONSTRAINT "ShiftPreset_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
