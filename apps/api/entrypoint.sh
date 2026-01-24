#!/bin/sh
set -e

# Zawsze upewnij się, że jesteś w katalogu API
cd /app/apps/api

echo "Running Prisma migrations..."
# POPRAWNE wywołanie Prisma przez pnpm, a nie przez "node prisma"
pnpm exec prisma migrate deploy

echo "Starting API..."
node dist/main.js
