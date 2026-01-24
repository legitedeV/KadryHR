#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/kadryhr/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "Backup dir not found: ${BACKUP_DIR}"
  exit 0
fi

find "${BACKUP_DIR}" -type f -name "*.dump" -mtime "+${RETENTION_DAYS}" -print -delete
echo "Rotation complete for ${BACKUP_DIR} (kept ${RETENTION_DAYS} days)"
