#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT_DIR/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create one by copying .env.example to .env or set DEPLOY_ENV_FILE."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker compose)
else
  DOCKER_COMPOSE=(docker-compose)
fi

echo "Starting deployment with env file: $ENV_FILE"
"${DOCKER_COMPOSE[@]}" --env-file "$ENV_FILE" up -d --build

echo "Running database migrations..."
"${DOCKER_COMPOSE[@]}" --env-file "$ENV_FILE" exec -T api node dist/db/migrate.js

echo "Deployment complete."
