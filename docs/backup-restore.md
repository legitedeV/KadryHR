# Backup & Restore

KadryHR wspiera backupy Postgresa i MinIO przez skrypty w `infra/backup/`.

## Backup Postgres

Skrypt: `infra/backup/backup-postgres.sh`

Wymaga:
- dostęp do kontenera `kadryhr-postgres`
- zmiennych:
  - `POSTGRES_USER` (domyślnie `kadryhr`)
  - `POSTGRES_DB` (domyślnie `kadryhr`)
  - `BACKUP_DIR` (domyślnie `/var/backups/kadryhr/postgres`)

Przykład:
```
POSTGRES_CONTAINER=kadryhr-postgres BACKUP_DIR=/var/backups/kadryhr/postgres ./infra/backup/backup-postgres.sh
```

## Backup MinIO

Skrypt: `infra/backup/backup-minio.sh`

Wymaga:
- MinIO w sieci Dockera
- ustawienia S3 offsite:
  - `BACKUP_S3_ENDPOINT`
  - `BACKUP_S3_ACCESS_KEY`
  - `BACKUP_S3_SECRET_KEY`
  - `BACKUP_S3_BUCKET`

Przykład:
```
MINIO_ENDPOINT=http://kadryhr-minio:9000 \\
MINIO_ACCESS_KEY=... \\
MINIO_SECRET_KEY=... \\
BACKUP_S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com \\
BACKUP_S3_ACCESS_KEY=... \\
BACKUP_S3_SECRET_KEY=... \\
BACKUP_S3_BUCKET=kadryhr-backups \\
./infra/backup/backup-minio.sh
```

## Rotacja backupów

Skrypt: `infra/backup/rotate-backups.sh` usuwa lokalne backupy starsze niż N dni.

Przykład:
```
BACKUP_DIR=/var/backups/kadryhr/postgres RETENTION_DAYS=14 ./infra/backup/rotate-backups.sh
```

## Cron (systemd timer)

Przykładowy crontab:
```
0 2 * * * /opt/kadryhr/infra/backup/backup-postgres.sh
15 2 * * * /opt/kadryhr/infra/backup/backup-minio.sh
30 2 * * * /opt/kadryhr/infra/backup/rotate-backups.sh
```

## Restore Postgres

1. Skopiuj dump do serwera.
2. Odtwórz:
```
pg_restore -U kadryhr -d kadryhr /path/to/dump.dump
```

## Restore MinIO

1. Pobierz backup z offsite.
2. Przywróć:
```
mc mirror /path/to/backup offsite/minio
```
