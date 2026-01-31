#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
PROVIDER="${PROVIDER:-google}"

# 1) Start OAuth (captures cookies + redirect)
# NOTE: Replace REDIRECT_PATH as needed.
curl -sS -D /tmp/oauth_headers.txt -o /dev/null \
  -c /tmp/oauth_cookies.txt \
  "$BASE_URL/api/auth/oauth/$PROVIDER/start?redirect=/panel"

# 2) Simulated callback twice (replace CODE/STATE with real values from provider)
CALLBACK_CODE="${CALLBACK_CODE:-REPLACE_WITH_REAL_CODE}"
CALLBACK_STATE="${CALLBACK_STATE:-REPLACE_WITH_REAL_STATE}"

for attempt in 1 2; do
  echo "\nAttempt ${attempt}:"
  curl -i -sS \
    -b /tmp/oauth_cookies.txt \
    "$BASE_URL/api/auth/oauth/$PROVIDER/callback?code=$CALLBACK_CODE&state=$CALLBACK_STATE"
done
