#!/usr/bin/env bash
set -euo pipefail

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://kadryhr-minio:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
MINIO_BUCKET_AVATARS="${MINIO_BUCKET_AVATARS:-kadryhr-avatars}"
MINIO_BUCKET_FILES="${MINIO_BUCKET_FILES:-kadryhr-files}"

BACKUP_S3_ENDPOINT="${BACKUP_S3_ENDPOINT:?BACKUP_S3_ENDPOINT is required}"
BACKUP_S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:?BACKUP_S3_ACCESS_KEY is required}"
BACKUP_S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:?BACKUP_S3_SECRET_KEY is required}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"

DOCKER_NETWORK="${DOCKER_NETWORK:-kadryhr_default}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

docker run --rm --network "${DOCKER_NETWORK}" \
  -e MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY}" \
  -e MINIO_SECRET_KEY="${MINIO_SECRET_KEY}" \
  minio/mc:latest \
  /bin/sh -c "
    mc alias set minio ${MINIO_ENDPOINT} ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY};
    mc alias set offsite ${BACKUP_S3_ENDPOINT} ${BACKUP_S3_ACCESS_KEY} ${BACKUP_S3_SECRET_KEY};
    mc mirror --overwrite minio/${MINIO_BUCKET_AVATARS} offsite/${BACKUP_S3_BUCKET}/minio/${MINIO_BUCKET_AVATARS}/${TIMESTAMP};
    mc mirror --overwrite minio/${MINIO_BUCKET_FILES} offsite/${BACKUP_S3_BUCKET}/minio/${MINIO_BUCKET_FILES}/${TIMESTAMP};
  "

echo "MinIO backup uploaded to ${BACKUP_S3_BUCKET} at ${TIMESTAMP}"
