-- Add APPROVED value to ScheduleStatus enum
ALTER TYPE "ScheduleStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
