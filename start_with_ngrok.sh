#!/usr/bin/env bash
set -eu

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ENV="$PROJECT_DIR/../../.env"
PROJECT_ENV="$PROJECT_DIR/.env"
NGROK_PID=""

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not installed or not available in PATH."
  exit 1
fi

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
  echo "Set NGROK_URL or PUBLIC_BASE_URL before starting the development server."
  exit 1
fi

cleanup() {
  if [ -n "${NGROK_PID}" ] && kill -0 "${NGROK_PID}" 2>/dev/null; then
    kill "${NGROK_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting ngrok for local Khalti callback testing..."
echo "Using public URL: ${PUBLIC_URL}"
ngrok http "${PORT}" --url="${PUBLIC_URL}" &
NGROK_PID=$!

echo "Starting Node server in watch mode on port ${PORT}..."
node --watch "$PROJECT_DIR/src/server.js"
