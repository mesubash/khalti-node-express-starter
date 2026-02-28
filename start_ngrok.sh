#!/usr/bin/env bash
set -eu

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ENV="$PROJECT_DIR/../../.env"
PROJECT_ENV="$PROJECT_DIR/.env"

if [ -f "$WORKSPACE_ENV" ]; then
  set -a
  . "$WORKSPACE_ENV"
  set +a
fi

if [ -f "$PROJECT_ENV" ]; then
  set -a
  . "$PROJECT_ENV"
  set +a
fi

PORT="${PORT:-3000}"
PUBLIC_URL="${NGROK_URL:-${PUBLIC_BASE_URL:-}}"

if [ -z "$PUBLIC_URL" ]; then
  echo "Set NGROK_URL or PUBLIC_BASE_URL before starting ngrok."
  exit 1
fi

echo "Starting ngrok tunnel for khalti-node-express-starter on port ${PORT}..."
echo "Using public URL: ${PUBLIC_URL}"

exec ngrok http "${PORT}" --url="${PUBLIC_URL}"
