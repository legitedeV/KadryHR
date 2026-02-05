#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE_URL="${API_BASE_URL:-http://localhost:4000/api}"

log() {
  printf "[%s] %s\n" "$(date +%H:%M:%S)" "$*"
}

check_status() {
  local url="$1"
  local expected="$2"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [[ "$status" != "$expected" ]]; then
    log "FAIL $url (expected $expected, got $status)"
    return 1
  fi
  log "OK   $url ($status)"
}

log "Smoke: backend health"
check_status "$API_BASE_URL/health" "200"

log "Smoke: requestId header"
request_id_header=$(curl -s -D - "$API_BASE_URL/health" -o /dev/null | rg -i "x-request-id" || true)
if [[ -z "$request_id_header" ]]; then
  log "FAIL missing x-request-id header"
  exit 1
fi
log "OK   $request_id_header"

log "Smoke: frontend routes"
check_status "$BASE_URL/panel/dashboard" "200"
check_status "$BASE_URL/panel/grafik" "200"
check_status "$BASE_URL/panel/pracownicy" "200"
check_status "$BASE_URL/panel/rcp" "200"

if [[ -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" ]]; then
  log "Smoke: auth login"
  auth_status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE_URL/auth/login" \
    -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"$SMOKE_PASSWORD\"}")
  if [[ "$auth_status" != "200" ]]; then
    log "FAIL login (status $auth_status)"
    exit 1
  fi
  log "OK   login (status $auth_status)"
else
  log "SKIP auth login (SMOKE_EMAIL/SMOKE_PASSWORD not set)"
fi

log "Smoke checks complete."
