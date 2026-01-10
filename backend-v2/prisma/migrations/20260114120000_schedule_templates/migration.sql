-- Add availability override reason to shifts
ALTER TABLE "Shift"
ADD COLUMN IF NOT EXISTS "availabilityOverrideReason" TEXT;

-- Schedule templates
CREATE TABLE IF NOT EXISTS "ScheduleTemplate" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScheduleTemplateShift" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT,
    "position" TEXT,
    "notes" TEXT,
    "color" TEXT,
    "weekday" "Weekday" NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleTemplateShift_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "ScheduleTemplate"
ADD CONSTRAINT "ScheduleTemplate_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleTemplate"
ADD CONSTRAINT "ScheduleTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScheduleTemplateShift"
ADD CONSTRAINT "ScheduleTemplateShift_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleTemplateShift"
ADD CONSTRAINT "ScheduleTemplateShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleTemplateShift"
ADD CONSTRAINT "ScheduleTemplateShift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "ScheduleTemplate_organisationId_idx" ON "ScheduleTemplate"("organisationId");
CREATE INDEX IF NOT EXISTS "ScheduleTemplateShift_templateId_idx" ON "ScheduleTemplateShift"("templateId");
CREATE INDEX IF NOT EXISTS "ScheduleTemplateShift_employeeId_idx" ON "ScheduleTemplateShift"("employeeId");
CREATE INDEX IF NOT EXISTS "ScheduleTemplateShift_locationId_idx" ON "ScheduleTemplateShift"("locationId");
