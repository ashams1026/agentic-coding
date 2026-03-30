#!/usr/bin/env bash
set -euo pipefail

# ── AgentOps Setup Script ──────────────────────────────────────
#
# Installs dependencies, builds the project, creates the data
# directory, runs migrations, and seeds default personas.
#
# Usage: ./scripts/setup.sh
#
# Environment variables:
#   AGENTOPS_DB_PATH  — SQLite database path
#                       (default: ~/.agentops/data/agentops.db)

AGENTOPS_DIR="${HOME}/.agentops"
AGENTOPS_DB_PATH="${AGENTOPS_DB_PATH:-${AGENTOPS_DIR}/data/agentops.db}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
fail()  { echo -e "${RED}[fail]${NC}  $*"; exit 1; }

echo ""
echo "  AgentOps Setup"
echo "  ─────────────────────────────────"
echo ""

# ── 1. Check Node >= 22 ────────────────────────────────────────

info "Checking Node.js version..."
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install Node.js 22+ from https://nodejs.org"
fi

NODE_VERSION=$(node -v | sed 's/^v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$NODE_MAJOR" -lt 22 ]; then
  fail "Node.js $NODE_VERSION found, but >= 22 is required."
fi
ok "Node.js $NODE_VERSION"

# ── 2. Check pnpm installed ────────────────────────────────────

info "Checking pnpm..."
if ! command -v pnpm &>/dev/null; then
  fail "pnpm is not installed. Install it with: npm install -g pnpm"
fi

PNPM_VERSION=$(pnpm --version)
ok "pnpm $PNPM_VERSION"

# ── 3. Install dependencies ────────────────────────────────────

info "Installing dependencies..."
pnpm install --frozen-lockfile 2>&1 | tail -1
ok "Dependencies installed"

# ── 4. Build project ───────────────────────────────────────────

info "Building project..."
pnpm build 2>&1 | tail -1
ok "Project built"

# ── 5. Create ~/.agentops/ directory structure ──────────────────

info "Creating data directory at ${AGENTOPS_DIR}..."

mkdir -p "${AGENTOPS_DIR}/config"
mkdir -p "${AGENTOPS_DIR}/logs"
mkdir -p "$(dirname "$AGENTOPS_DB_PATH")"

ok "Directory structure created"

# ── 6. Run migrations ──────────────────────────────────────────

info "Running database migrations..."
DATABASE_URL="$AGENTOPS_DB_PATH" pnpm --filter @agentops/backend db:migrate 2>&1 | tail -1
ok "Migrations applied to ${AGENTOPS_DB_PATH}"

# ── 7. Seed default personas ───────────────────────────────────

info "Seeding default personas..."
DATABASE_URL="$AGENTOPS_DB_PATH" pnpm --filter @agentops/backend db:seed 2>&1 | tail -1
ok "Default personas seeded"

# ── 8. Summary ──────────────────────────────────────────────────

echo ""
echo "  ─────────────────────────────────"
echo -e "  ${GREEN}Setup complete!${NC}"
echo ""
echo "  Data directory:  ${AGENTOPS_DIR}"
echo "  Database:        ${AGENTOPS_DB_PATH}"
echo "  Log directory:   ${AGENTOPS_DIR}/logs"
echo ""
echo "  Next steps:"
echo "    1. Start the server:    pnpm dev"
echo "    2. Open the UI:         http://localhost:5173"
echo "    3. Or run as a service: pnpm service:start"
echo ""
echo "  CLI commands (after build):"
echo "    agentops start     Start server (foreground)"
echo "    agentops stop      Stop server"
echo "    agentops status    Show server status"
echo "    agentops dev       Start in dev mode (watch)"
echo ""
