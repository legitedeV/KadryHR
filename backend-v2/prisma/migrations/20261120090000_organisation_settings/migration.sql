-- CreateEnum
CREATE TYPE "SchedulePeriodType" AS ENUM ('WEEKLY', 'MONTHLY', 'FOUR_WEEKS');

-- AlterTable
ALTER TABLE "Organisation"
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "addressPostalCode" TEXT,
ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressCountry" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "invoiceAddress" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "defaultWorkdayStart" TEXT DEFAULT '08:00',
ADD COLUMN     "defaultWorkdayEnd" TEXT DEFAULT '16:00',
ADD COLUMN     "defaultBreakMinutes" INTEGER DEFAULT 30,
ADD COLUMN     "workDays" "Weekday"[] DEFAULT ARRAY[]::"Weekday"[],
ADD COLUMN     "schedulePeriod" "SchedulePeriodType" NOT NULL DEFAULT 'WEEKLY';

-- AlterTable
ALTER TABLE "Location"
ADD COLUMN     "code" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "addressPostalCode" TEXT,
ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressCountry" TEXT,
ADD COLUMN     "defaultOpeningTimeFrom" TEXT,
ADD COLUMN     "defaultOpeningTimeTo" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
