#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${INFRA_DIR}/.env"
COMPOSE_FILE="${INFRA_DIR}/compose.yml"
TS="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="${INFRA_DIR}/logs/run-${TS}"
LOG_FILE="${RUN_DIR}/fix-prestashop-db.log"
mkdir -p "${RUN_DIR}"

exec > >(tee -a "${LOG_FILE}") 2>&1

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy infra/.env.example to infra/.env first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

: "${MYSQL_DATABASE:?MYSQL_DATABASE is required}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required}"
SERVER_IP="${SERVER_IP:-51.68.151.159}"
TABLE_PREFIX="${DB_PREFIX:-ps_}"

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

db_cid="$(compose ps -q mariadb)"
ps_cid="$(compose ps -q prestashop)"
if [[ -z "${db_cid}" || -z "${ps_cid}" ]]; then
  echo "Containers are not running. Start stack first: docker compose -f infra/compose.yml up -d" >&2
  exit 1
fi

db_exec() {
  local sql="$1"
  docker exec -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" "${db_cid}" \
    mysql -uroot -N -B -e "${sql}"
}

echo "Ensuring database exists..."
db_exec "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "Ensuring language rows are active..."
db_exec "UPDATE \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` SET active=1 WHERE iso_code='pl';"
db_exec "UPDATE \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` SET active=1 WHERE iso_code='en' AND NOT EXISTS (SELECT 1 FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` WHERE active=1);"
db_exec "UPDATE \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` SET active=1 WHERE id_lang=(SELECT id_lang FROM (SELECT id_lang FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` ORDER BY id_lang LIMIT 1) t) AND NOT EXISTS (SELECT 1 FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` WHERE active=1);"

active_lang="$(db_exec "SELECT id_lang FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` WHERE active=1 ORDER BY (iso_code='pl') DESC, (iso_code='en') DESC, id_lang ASC LIMIT 1;")"
if [[ -z "${active_lang}" ]]; then
  echo "No language found. Inserting fallback english language row."
  db_exec "INSERT INTO \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` (name, active, iso_code, language_code, locale, date_format_lite, date_format_full, is_rtl)
           SELECT 'English (English)',1,'en','en-us','en-US','m/d/Y','m/d/Y H:i:s',0
           WHERE NOT EXISTS (SELECT 1 FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` WHERE iso_code='en');"
  active_lang="$(db_exec "SELECT id_lang FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` WHERE active=1 ORDER BY (iso_code='en') DESC, id_lang ASC LIMIT 1;")"
fi

if [[ -z "${active_lang}" ]]; then
  echo "Unable to determine active language id." >&2
  exit 1
fi

lang_iso="$(db_exec "SELECT iso_code FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}lang\` WHERE id_lang=${active_lang} LIMIT 1;")"
default_locale="en-US"
if [[ "${lang_iso}" == "pl" ]]; then
  default_locale="pl-PL"
fi

echo "Updating PS_LANG_DEFAULT, PS_LOCALE_LANGUAGE, and shop domain..."
db_exec "INSERT INTO \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}configuration\` (name, value, date_add, date_upd)
         VALUES ('PS_LANG_DEFAULT', '${active_lang}', NOW(), NOW())
         ON DUPLICATE KEY UPDATE value=VALUES(value), date_upd=NOW();"

db_exec "INSERT INTO \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}configuration\` (name, value, date_add, date_upd)
         VALUES ('PS_LOCALE_LANGUAGE', '${default_locale}', NOW(), NOW())
         ON DUPLICATE KEY UPDATE value=VALUES(value), date_upd=NOW();"

db_exec "UPDATE \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}shop\` SET id_lang=${active_lang} WHERE id_lang IS NULL OR id_lang=0 OR id_lang<>${active_lang};"
db_exec "UPDATE \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}shop_url\` SET domain='${SERVER_IP}', domain_ssl='${SERVER_IP}' WHERE main=1;"

echo "Clearing cache and restarting prestashop..."
docker exec "${ps_cid}" sh -lc 'rm -rf /var/www/html/var/cache/* || true'
compose restart prestashop >/dev/null
sleep 5

admin_folder="$(docker exec "${ps_cid}" sh -lc "find /var/www/html -maxdepth 1 -type d -name 'admin*' | head -n1" | xargs basename || true)"
if [[ -z "${admin_folder}" ]]; then
  admin_folder="${PS_FOLDER_ADMIN:-admin-dev}"
fi

front_code="$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ || true)"
admin_code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:8080/${admin_folder}/" || true)"

echo "Final verification"
echo "Front code: ${front_code}"
echo "Admin code: ${admin_code}"
if [[ "${front_code}" != "200" ]]; then
  echo "Front office check failed." >&2
  exit 1
fi
if [[ "${admin_code}" != "200" && "${admin_code}" != "302" ]]; then
  echo "Back office check failed." >&2
  exit 1
fi

echo "Log saved to ${LOG_FILE}"
