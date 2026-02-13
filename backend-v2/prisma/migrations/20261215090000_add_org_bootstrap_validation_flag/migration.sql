ALTER TABLE "Organisation"
ADD COLUMN IF NOT EXISTS "requireScheduleValidationBeforePublish" BOOLEAN NOT NULL DEFAULT true;
