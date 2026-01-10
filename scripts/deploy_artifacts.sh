#!/usr/bin/env bash
set -euo pipefail

REPO_SLUG=${REPO_SLUG:-"KadryHR/KadryHR"}
WORKFLOW_FILE=${WORKFLOW_FILE:-"build-artifacts.yml"}
BRANCH=${BRANCH:-"main"}
ARTIFACT_PREFIX=${ARTIFACT_PREFIX:-"kadryhr-build-"}
WORKDIR=${WORKDIR:-"/var/www/kadryhr"}
BACKUP_DIR=${BACKUP_DIR:-"${WORKDIR}/backups"}
TMP_DIR=${TMP_DIR:-"/tmp/kadryhr-artifact"}

usage() {
  cat <<USAGE
Usage:
  $0 deploy
  $0 rollback <timestamp>

Environment variables:
  GITHUB_TOKEN     (required) GitHub token with repo access.
  REPO_SLUG        (default: KadryHR/KadryHR)
  WORKFLOW_FILE    (default: build-artifacts.yml)
  BRANCH           (default: main)
  ARTIFACT_PREFIX  (default: kadryhr-build-)
  WORKDIR          (default: /var/www/kadryhr)
  BACKUP_DIR       (default: /var/www/kadryhr/backups)
USAGE
}

require_token() {
  if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    echo "GITHUB_TOKEN is required." >&2
    exit 1
  fi
}

api_get() {
  curl -sS -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "$1"
}

latest_run_id() {
  api_get "https://api.github.com/repos/${REPO_SLUG}/actions/workflows/${WORKFLOW_FILE}/runs?branch=${BRANCH}&per_page=1" \
    | jq -r '.workflow_runs[0].id'
}

latest_artifact_url() {
  local run_id=$1
  api_get "https://api.github.com/repos/${REPO_SLUG}/actions/runs/${run_id}/artifacts" \
    | jq -r --arg prefix "${ARTIFACT_PREFIX}" '.artifacts | map(select(.name | startswith($prefix))) | sort_by(.created_at) | last | .archive_download_url'
}

backup_current() {
  local ts=$1
  local backup_path="${BACKUP_DIR}/${ts}"

  mkdir -p "${backup_path}/backend-v2" "${backup_path}/frontend-v2"

  if [[ -d "${WORKDIR}/backend-v2/dist" ]]; then
    rsync -a "${WORKDIR}/backend-v2/dist" "${backup_path}/backend-v2/"
  fi

  if [[ -d "${WORKDIR}/frontend-v2/.next" ]]; then
    rsync -a "${WORKDIR}/frontend-v2/.next" "${backup_path}/frontend-v2/"
  fi

  if [[ -d "${WORKDIR}/frontend-v2/public" ]]; then
    rsync -a "${WORKDIR}/frontend-v2/public" "${backup_path}/frontend-v2/"
  fi

  if [[ -d "${WORKDIR}/backend-v2/prisma" ]]; then
    rsync -a "${WORKDIR}/backend-v2/prisma" "${backup_path}/backend-v2/"
  fi
}

deploy() {
  require_token
  mkdir -p "${TMP_DIR}" "${BACKUP_DIR}"

  local run_id
  run_id=$(latest_run_id)
  if [[ -z "${run_id}" || "${run_id}" == "null" ]]; then
    echo "No workflow runs found." >&2
    exit 1
  fi

  local artifact_url
  artifact_url=$(latest_artifact_url "${run_id}")
  if [[ -z "${artifact_url}" || "${artifact_url}" == "null" ]]; then
    echo "No artifacts found for run ${run_id}." >&2
    exit 1
  fi

  local ts
  ts=$(date +%Y%m%d%H%M%S)
  backup_current "${ts}"

  rm -rf "${TMP_DIR:?}"/*
  curl -sSL -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -o "${TMP_DIR}/artifact.zip" \
    "${artifact_url}"

  unzip -q "${TMP_DIR}/artifact.zip" -d "${TMP_DIR}/extracted"

  rsync -a --delete "${TMP_DIR}/extracted/backend-v2/dist" "${WORKDIR}/backend-v2/dist"
  rsync -a --delete "${TMP_DIR}/extracted/backend-v2/prisma" "${WORKDIR}/backend-v2/prisma"
  rsync -a "${TMP_DIR}/extracted/backend-v2/package.json" "${TMP_DIR}/extracted/backend-v2/package-lock.json" "${WORKDIR}/backend-v2/"

  rsync -a --delete "${TMP_DIR}/extracted/frontend-v2/.next" "${WORKDIR}/frontend-v2/.next"
  rsync -a --delete "${TMP_DIR}/extracted/frontend-v2/public" "${WORKDIR}/frontend-v2/public"
  rsync -a "${TMP_DIR}/extracted/frontend-v2/package.json" "${TMP_DIR}/extracted/frontend-v2/package-lock.json" "${TMP_DIR}/extracted/frontend-v2/next.config.mjs" "${WORKDIR}/frontend-v2/"

  if [[ -f "${WORKDIR}/backend-v2/package.json" ]]; then
    (cd "${WORKDIR}/backend-v2" && npx prisma migrate deploy)
  fi

  pm2 reload kadryhr-backend-v2
  pm2 reload kadryhr-frontend-v2

  echo "Deploy complete. Backup stored at ${BACKUP_DIR}/${ts}."
}

rollback() {
  local ts=${1:-}
  if [[ -z "${ts}" ]]; then
    echo "Rollback requires a timestamp (folder name under ${BACKUP_DIR})." >&2
    exit 1
  fi

  local backup_path="${BACKUP_DIR}/${ts}"
  if [[ ! -d "${backup_path}" ]]; then
    echo "Backup not found: ${backup_path}" >&2
    exit 1
  fi

  rsync -a --delete "${backup_path}/backend-v2/dist" "${WORKDIR}/backend-v2/dist"
  rsync -a --delete "${backup_path}/backend-v2/prisma" "${WORKDIR}/backend-v2/prisma"
  rsync -a --delete "${backup_path}/frontend-v2/.next" "${WORKDIR}/frontend-v2/.next"
  rsync -a --delete "${backup_path}/frontend-v2/public" "${WORKDIR}/frontend-v2/public"

  pm2 reload kadryhr-backend-v2
  pm2 reload kadryhr-frontend-v2

  echo "Rollback complete from ${backup_path}."
}

case "${1:-}" in
  deploy)
    deploy
    ;;
  rollback)
    rollback "${2:-}"
    ;;
  *)
    usage
    exit 1
    ;;
esac
