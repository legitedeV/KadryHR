-- Add enabled modules configuration per organisation
ALTER TABLE "Organisation"
ADD COLUMN "enabledModules" JSONB NOT NULL DEFAULT '{"grafik": true, "dyspozycje": true, "rcp": true, "urlopy": true, "raporty": true}'::jsonb;

-- Ensure all existing rows have a complete backward-compatible module map
UPDATE "Organisation"
SET "enabledModules" = '{"grafik": true, "dyspozycje": true, "rcp": true, "urlopy": true, "raporty": true}'::jsonb
WHERE "enabledModules" IS NULL
   OR jsonb_typeof("enabledModules") <> 'object';
