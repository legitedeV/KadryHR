#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-kadryhr-postgres}"
POSTGRES_USER="${POSTGRES_USER:-kadryhr}"
POSTGRES_DB="${POSTGRES_DB:-kadryhr}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/kadryhr/postgres}"

mkdir -p "${BACKUP_DIR}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/kadryhr_pg_${TIMESTAMP}.dump"

docker exec -i "${POSTGRES_CONTAINER}" pg_dump -U "${POSTGRES_USER}" -Fc "${POSTGRES_DB}" > "${BACKUP_FILE}"

echo "Postgres backup created: ${BACKUP_FILE}"
