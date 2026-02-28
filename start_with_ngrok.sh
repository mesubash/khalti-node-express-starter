#!/usr/bin/env bash
set -eu

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ENV="$PROJECT_DIR/.env"
NGROK_PID=""
NGROK_LOG_FILE="${TMPDIR:-/tmp}/khalti-node-express-starter-ngrok.log"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not installed or not available in PATH."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to verify the ngrok tunnel."
  exit 1
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
rm -f "${NGROK_LOG_FILE}"
ngrok http "${PORT}" --url="${PUBLIC_URL}" --log="${NGROK_LOG_FILE}" --log-format=logfmt &
NGROK_PID=$!

echo "Waiting for ngrok to come online..."
i=0
while [ "$i" -lt 20 ]; do
  if ! kill -0 "${NGROK_PID}" 2>/dev/null; then
    echo "ngrok exited before the tunnel came online."
    if [ -f "${NGROK_LOG_FILE}" ]; then
      echo "ngrok log:"
      cat "${NGROK_LOG_FILE}"
    fi
    exit 1
  fi

  if curl -fsS http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
    echo "ngrok tunnel is online."
    break
  fi

  sleep 1
  i=$((i + 1))
done

if [ "$i" -ge 20 ]; then
  echo "Timed out waiting for ngrok to come online."
  if [ -f "${NGROK_LOG_FILE}" ]; then
    echo "ngrok log:"
    cat "${NGROK_LOG_FILE}"
  fi
  exit 1
fi

echo "Starting Node server in watch mode on port ${PORT}..."
node --watch "$PROJECT_DIR/src/server.js"
