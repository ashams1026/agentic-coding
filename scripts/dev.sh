#!/usr/bin/env bash
# Dev server launcher — skips starting services that are already running.
# Backend (port 3001) has hot reload via tsx watch.
# Frontend (port 5173/5174) has Vite HMR.
# Both pick up file changes automatically, so re-starting is unnecessary.

set -e

BACKEND_PORT=3001
FRONTEND_PORT_1=5173
FRONTEND_PORT_2=5174

check_backend() {
  curl -sf "http://localhost:${BACKEND_PORT}/api/health" > /dev/null 2>&1
}

check_frontend() {
  curl -sf "http://localhost:${FRONTEND_PORT_1}/" > /dev/null 2>&1 || \
  curl -sf "http://localhost:${FRONTEND_PORT_2}/" > /dev/null 2>&1
}

NEED_BACKEND=true
NEED_FRONTEND=true

if check_backend; then
  echo "✓ Backend already running on port ${BACKEND_PORT} — skipping"
  NEED_BACKEND=false
fi

if check_frontend; then
  echo "✓ Frontend already running — skipping"
  NEED_FRONTEND=false
fi

if [ "$NEED_BACKEND" = false ] && [ "$NEED_FRONTEND" = false ]; then
  echo "All dev servers already running. Nothing to start."
  exit 0
fi

if [ "$NEED_BACKEND" = true ] && [ "$NEED_FRONTEND" = true ]; then
  echo "Starting backend + frontend..."
  pnpm --parallel -r dev
elif [ "$NEED_BACKEND" = true ]; then
  echo "Starting backend only..."
  pnpm --filter backend dev
elif [ "$NEED_FRONTEND" = true ]; then
  echo "Starting frontend only..."
  pnpm --filter frontend dev
fi
