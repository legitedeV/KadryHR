#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${INFRA_DIR}/.env"
COMPOSE_FILE="${INFRA_DIR}/compose.yml"
THEME_NAME="forestcatering-premium"
THEME_SRC="${INFRA_DIR}/theme/${THEME_NAME}"

if [[ ! -d "${THEME_SRC}" ]]; then
  echo "Missing theme source directory: ${THEME_SRC}" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command is required to deploy theme." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${INFRA_DIR}/.env.example" ]]; then
    cp "${INFRA_DIR}/.env.example" "${ENV_FILE}"
  else
    echo "Missing ${ENV_FILE}" >&2
    exit 1
  fi
fi

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

cd "${INFRA_DIR}"
ps_cid="$(compose ps -q prestashop)"
if [[ -z "${ps_cid}" ]]; then
  echo "prestashop container not found. Start stack first: cd infra && docker compose up -d" >&2
  exit 1
fi

echo "Copying theme into container volume..."
compose exec -T prestashop sh -lc "mkdir -p /var/www/html/themes/${THEME_NAME} && rm -rf /var/www/html/themes/${THEME_NAME}/*"
tar -C "${THEME_SRC}" -cf - . | compose exec -T prestashop sh -lc "tar -xf - -C /var/www/html/themes/${THEME_NAME}"
compose exec -T prestashop sh -lc "chown -R www-data:www-data /var/www/html/themes/${THEME_NAME}"

echo "Clearing cache..."
compose exec -T prestashop sh -lc 'rm -rf /var/www/html/var/cache/*'

echo "Activating theme..."
db_cid="$(compose ps -q mariadb)"
if [[ -z "${db_cid}" ]]; then
  echo "mariadb container not found." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

: "${MYSQL_DATABASE:?MYSQL_DATABASE is required in infra/.env}"
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required in infra/.env}"
TABLE_PREFIX="${DB_PREFIX:-ps_}"

sql="
INSERT INTO \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}configuration\` (name, value, date_add, date_upd)
VALUES ('PS_THEME_NAME', '${THEME_NAME}', NOW(), NOW())
ON DUPLICATE KEY UPDATE value = VALUES(value), date_upd = NOW();

SET @theme_id := (SELECT id_theme FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}theme\` WHERE name='${THEME_NAME}' LIMIT 1);
UPDATE \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}shop\` SET theme_name='${THEME_NAME}' WHERE theme_name <> '${THEME_NAME}' OR theme_name IS NULL;

UPDATE \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}shop\`
SET id_theme = @theme_id
WHERE @theme_id IS NOT NULL;
"

docker exec -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" "${db_cid}" mysql -uroot -N -B -e "${sql}"

compose exec -T prestashop sh -lc 'rm -rf /var/www/html/var/cache/*'

code="$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ || true)"
if [[ "${code}" != "200" && "${code}" != "302" ]]; then
  echo "Smoke check failed with code ${code}. Dumping Apache error log..." >&2
  compose exec -T prestashop sh -lc 'tail -n 200 /var/log/apache2/error.log || tail -n 200 /var/log/apache2/*.log || true' >&2
  exit 1
fi

active_theme="$(docker exec -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" "${db_cid}" mysql -uroot -N -B -e "SELECT value FROM \`${MYSQL_DATABASE}\`.\`${TABLE_PREFIX}configuration\` WHERE name='PS_THEME_NAME' LIMIT 1;")"

echo "OK"
echo "active_theme=${active_theme}"
