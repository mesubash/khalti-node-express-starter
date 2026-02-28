#!/usr/bin/env bash
set -eu

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
NGROK_PID=""

cleanup() {
  if [ -n "${NGROK_PID}" ] && kill -0 "${NGROK_PID}" 2>/dev/null; then
    kill "${NGROK_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting ngrok for local Khalti callback testing..."
bash "$PROJECT_DIR/start_ngrok.sh" &
NGROK_PID=$!

echo "Starting Node server in watch mode on port ${PORT:-3000}..."
node --watch "$PROJECT_DIR/src/server.js"
