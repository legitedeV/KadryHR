-- Align Role enum across environments by adding ADMIN if missing
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';
