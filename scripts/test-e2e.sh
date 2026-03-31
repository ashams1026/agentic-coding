#!/usr/bin/env bash
#
# E2E Test Environment — Setup & Teardown
#
# Usage:
#   ./scripts/test-e2e.sh setup     # Seed DB, start backend + frontend
#   ./scripts/test-e2e.sh teardown  # Stop servers, delete test DB
#   ./scripts/test-e2e.sh seed      # Seed DB only (servers already running)
#
set -euo pipefail

E2E_DB="${AGENTOPS_E2E_DB:-/tmp/agentops-e2e-test.db}"
BACKEND_PORT="${AGENTOPS_BACKEND_PORT:-3001}"
FRONTEND_PORT="${AGENTOPS_FRONTEND_PORT:-5173}"
PID_DIR="/tmp/agentops-e2e-pids"

# ── Helpers ────────────────────────────────────────────────────────

check_port() {
  local port="$1"
  curl -sf "http://localhost:${port}/api/health" > /dev/null 2>&1 && return 0 || return 1
}

wait_for_port() {
  local port="$1" label="$2" timeout=30 elapsed=0
  echo "  Waiting for ${label} on :${port}..."
  while ! curl -sf "http://localhost:${port}" > /dev/null 2>&1; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "  ERROR: ${label} did not start within ${timeout}s"
      return 1
    fi
  done
  echo "  ${label} is up on :${port}"
}

# ── Seed ───────────────────────────────────────────────────────────

do_seed() {
  echo "Seeding E2E database: ${E2E_DB}"
  DATABASE_URL="$E2E_DB" npx tsx packages/backend/src/db/seed-e2e.ts
  echo ""
}

# ── Setup ──────────────────────────────────────────────────────────

do_setup() {
  echo "=== E2E Test Environment Setup ==="
  echo ""

  # Seed the test database
  do_seed

  # Create PID directory
  mkdir -p "$PID_DIR"

  # Start backend (skip if already running)
  if check_port "$BACKEND_PORT"; then
    echo "Backend already running on :${BACKEND_PORT} — skipping"
  else
    echo "Starting backend on :${BACKEND_PORT}..."
    DATABASE_URL="$E2E_DB" PORT="$BACKEND_PORT" \
      pnpm --filter @agentops/backend dev > /tmp/agentops-e2e-backend.log 2>&1 &
    echo $! > "${PID_DIR}/backend.pid"
    wait_for_port "$BACKEND_PORT" "Backend"
  fi

  # Start frontend (skip if already running)
  local frontend_up=false
  for p in 5173 5174; do
    if curl -sf "http://localhost:${p}" > /dev/null 2>&1; then
      FRONTEND_PORT="$p"
      frontend_up=true
      break
    fi
  done

  if [ "$frontend_up" = true ]; then
    echo "Frontend already running on :${FRONTEND_PORT} — skipping"
  else
    echo "Starting frontend on :${FRONTEND_PORT}..."
    pnpm --filter @agentops/frontend dev > /tmp/agentops-e2e-frontend.log 2>&1 &
    echo $! > "${PID_DIR}/frontend.pid"
    wait_for_port "$FRONTEND_PORT" "Frontend"
  fi

  echo ""
  echo "=== E2E Environment Ready ==="
  echo "  Backend:  http://localhost:${BACKEND_PORT}"
  echo "  Frontend: http://localhost:${FRONTEND_PORT}"
  echo "  Database: ${E2E_DB}"
  echo ""
  echo "Run tests, then: ./scripts/test-e2e.sh teardown"
}

# ── Teardown ───────────────────────────────────────────────────────

do_teardown() {
  echo "=== E2E Test Environment Teardown ==="
  echo ""

  # Stop servers we started
  for proc in backend frontend; do
    local pidfile="${PID_DIR}/${proc}.pid"
    if [ -f "$pidfile" ]; then
      local pid
      pid=$(cat "$pidfile")
      if kill -0 "$pid" 2>/dev/null; then
        echo "Stopping ${proc} (PID ${pid})..."
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
      fi
      rm -f "$pidfile"
    fi
  done

  # Delete test database
  if [ -f "$E2E_DB" ]; then
    echo "Deleting test database: ${E2E_DB}"
    rm -f "$E2E_DB" "${E2E_DB}-wal" "${E2E_DB}-shm"
  fi

  # Clean up PID directory
  rmdir "$PID_DIR" 2>/dev/null || true

  echo ""
  echo "=== Teardown Complete ==="
}

# ── Main ───────────────────────────────────────────────────────────

case "${1:-}" in
  setup)   do_setup ;;
  teardown) do_teardown ;;
  seed)    do_seed ;;
  *)
    echo "Usage: $0 {setup|teardown|seed}"
    echo ""
    echo "  setup     Seed E2E database, start backend + frontend"
    echo "  teardown  Stop servers, delete test database"
    echo "  seed      Seed database only (servers already running)"
    exit 1
    ;;
esac
