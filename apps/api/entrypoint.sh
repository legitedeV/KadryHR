#!/bin/sh
set -e

echo "Running Prisma migrations..."
node ./node_modules/.bin/prisma migrate deploy

echo "Starting API..."
exec node dist/main.js
