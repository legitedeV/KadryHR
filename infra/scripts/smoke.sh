#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${INFRA_DIR}/.env"
COMPOSE_FILE="${INFRA_DIR}/compose.yml"
TS="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="${INFRA_DIR}/logs/run-${TS}"
mkdir -p "${RUN_DIR}"
LOG_FILE="${RUN_DIR}/smoke.log"

exec > >(tee -a "${LOG_FILE}") 2>&1

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy infra/.env.example to infra/.env first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a
SERVER_IP="${SERVER_IP:-51.68.151.159}"

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

wait_for_service() {
  local service="$1"
  local timeout="${2:-180}"
  local start now cid status health
  start="$(date +%s)"
  cid="$(compose ps -q "${service}")"
  if [[ -z "${cid}" ]]; then
    echo "Service ${service} container not found." >&2
    return 1
  fi

  while true; do
    now="$(date +%s)"
    if (( now - start > timeout )); then
      echo "Timed out waiting for ${service}" >&2
      return 1
    fi
    status="$(docker inspect -f '{{.State.Status}}' "${cid}")"
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${cid}")"
    if [[ "${status}" == "running" && ( "${health}" == "healthy" || "${health}" == "none" ) ]]; then
      echo "${service} ready (status=${status}, health=${health})"
      return 0
    fi
    sleep 3
  done
}

echo "Starting stack..."
compose up -d

wait_for_service mariadb 240
wait_for_service prestashop 300

echo "Checking host port collision on 8080"
port_count="$(ss -ltn '( sport = :8080 )' | tail -n +2 | wc -l | tr -d ' ')"
if [[ "${port_count}" -gt 1 ]]; then
  echo "Port 8080 collision detected (${port_count} listeners)" >&2
  ss -ltn '( sport = :8080 )' || true
  exit 1
fi

"${SCRIPT_DIR}/fix-prestashop-db.sh"

front_local="$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ || true)"
front_public="$(curl -sS -o /dev/null -w '%{http_code}' "http://${SERVER_IP}/" || true)"

if [[ "${front_local}" != "200" ]]; then
  echo "Front local check failed: ${front_local}" >&2
  exit 1
fi
if [[ "${front_public}" != "200" && "${front_public}" != "302" ]]; then
  echo "Front public check failed: ${front_public}" >&2
  exit 1
fi

compose ps > "${RUN_DIR}/docker-compose-ps.txt"
compose logs --tail=200 > "${RUN_DIR}/docker-compose-logs-tail.txt"
curl -sSI http://127.0.0.1:8080/ > "${RUN_DIR}/curl-local-front.headers"
curl -sSI "http://${SERVER_IP}/" > "${RUN_DIR}/curl-public-front.headers"

mariadb_cid="$(compose ps -q mariadb)"
docker exec -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" "${mariadb_cid}" mysql -uroot -N -B -e \
  "SELECT name,value FROM ${MYSQL_DATABASE}.${DB_PREFIX:-ps_}configuration WHERE name IN ('PS_LANG_DEFAULT','PS_LOCALE_LANGUAGE') ORDER BY name;" \
  > "${RUN_DIR}/db-sanity.txt"

echo "Smoke passed"
echo "front_local=${front_local}"
echo "front_public=${front_public}"
echo "logs=${RUN_DIR}"
