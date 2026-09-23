#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  CiviSense AI — Fully Automated One-Command Startup
#
#  Usage:  ./start.sh
#  Stop:   Ctrl+C  (gracefully kills backend & frontend)
#
#  This script auto-handles EVERYTHING:
#    ✔ Python venv creation & dependency install
#    ✔ Node.js dependency install
#    ✔ Docker PostgreSQL startup
#    ✔ Database migrations & seeding
#    ✔ Backend (FastAPI) & Frontend (Vite) launch
# ─────────────────────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

# ── Colors ───────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log()   { echo -e "${CYAN}[CiviSense]${NC} $1"; }
ok()    { echo -e "${GREEN}  ✔${NC} $1"; }
warn()  { echo -e "${YELLOW}  ⚠${NC} $1"; }
fail()  { echo -e "${RED}  ✖${NC} $1"; }
step()  { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; log "${BOLD}$1${NC}"; }

# ── Cleanup on exit ──────────────────────────────────────
cleanup() {
    echo ""
    log "Shutting down..."
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && ok "Frontend stopped"
    [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && ok "Backend stopped"
    log "Done. Goodbye! 👋"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Banner ───────────────────────────────────────────────
echo -e "${CYAN}"
echo "   ╔═══════════════════════════════════════════╗"
echo "   ║                                           ║"
echo "   ║     🏛️  CiviSense AI — Auto Launcher      ║"
echo "   ║                                           ║"
echo "   ╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════
# STEP 1: Check base prerequisites (python3, node, docker)
# ═══════════════════════════════════════════════════════════
step "Step 1/7 — Checking system prerequisites"

# Python
if ! command -v python3 &>/dev/null; then
    fail "Python 3 is not installed. Please install Python 3.11+ from https://python.org"
    exit 1
fi
PYVER=$(python3 --version 2>&1)
ok "Python: $PYVER"

# Node.js
if ! command -v node &>/dev/null; then
    fail "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODEVER=$(node --version 2>&1)
ok "Node.js: $NODEVER"

# npm
if ! command -v npm &>/dev/null; then
    fail "npm is not installed. It should come with Node.js."
    exit 1
fi
ok "npm: $(npm --version 2>&1)"

# Docker
if ! command -v docker &>/dev/null; then
    fail "Docker is not installed. Please install Docker Desktop from https://docker.com"
    exit 1
fi
ok "Docker installed"

# ═══════════════════════════════════════════════════════════
# STEP 2: Python virtual environment & dependencies
# ═══════════════════════════════════════════════════════════
step "Step 2/7 — Setting up Python environment"

if [ ! -d "$ROOT_DIR/venv" ]; then
    log "Creating Python virtual environment..."
    python3 -m venv "$ROOT_DIR/venv"
    ok "Virtual environment created"
else
    ok "Virtual environment exists"
fi

# Check if key dependency (fastapi) is installed
if ! "$ROOT_DIR/venv/bin/python" -c "import fastapi" 2>/dev/null; then
    log "Installing Python dependencies (this may take a minute)..."
    "$ROOT_DIR/venv/bin/pip" install --quiet --upgrade pip
    "$ROOT_DIR/venv/bin/pip" install --quiet -r "$ROOT_DIR/backend/requirements.txt"
    ok "Python dependencies installed"
else
    ok "Python dependencies already installed"
fi

# ═══════════════════════════════════════════════════════════
# STEP 3: Frontend dependencies
# ═══════════════════════════════════════════════════════════
step "Step 3/7 — Setting up frontend dependencies"

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    log "Installing npm dependencies (this may take a minute)..."
    cd "$ROOT_DIR/frontend"
    npm install --silent 2>&1 | tail -1
    ok "Frontend dependencies installed"
else
    ok "Frontend dependencies already installed"
fi

# ═══════════════════════════════════════════════════════════
# STEP 4: Start PostgreSQL via Docker
# ═══════════════════════════════════════════════════════════
step "Step 4/7 — Starting PostgreSQL database"

# Start Docker daemon if not running
if ! docker info &>/dev/null; then
    warn "Docker daemon not running — starting Docker Desktop..."
    open -a Docker
    printf "  Waiting for Docker"
    for i in $(seq 1 60); do
        if docker info &>/dev/null; then
            echo ""
            ok "Docker daemon started"
            break
        fi
        printf "."
        sleep 2
        if [ "$i" -eq 60 ]; then
            echo ""
            fail "Docker failed to start within 2 minutes"
            exit 1
        fi
    done
else
    ok "Docker daemon running"
fi

# Start the database container
docker-compose -f "$ROOT_DIR/docker-compose.yml" up -d db 2>&1 | grep -v "obsolete" || true

# Wait for DB readiness
printf "  Waiting for database"
for i in $(seq 1 30); do
    if docker exec civisense_db pg_isready -U civisense -d civisense_db &>/dev/null; then
        echo ""
        ok "PostgreSQL ready on port 5433"
        break
    fi
    printf "."
    sleep 1
    if [ "$i" -eq 30 ]; then
        echo ""
        fail "Database failed to start within 30s"
        exit 1
    fi
done

# ═══════════════════════════════════════════════════════════
# STEP 5: Database migrations
# ═══════════════════════════════════════════════════════════
step "Step 5/7 — Running database migrations"

cd "$ROOT_DIR/backend"
"$ROOT_DIR/venv/bin/python" -m alembic upgrade head 2>&1 | tail -1
ok "Migrations up to date"

# ═══════════════════════════════════════════════════════════
# STEP 6: Seed database (if not already seeded)
# ═══════════════════════════════════════════════════════════
step "Step 6/7 — Seeding database"

cd "$ROOT_DIR/backend"
"$ROOT_DIR/venv/bin/python" -m seed.seed_data 2>&1
ok "Database seed check complete"

# ═══════════════════════════════════════════════════════════
# STEP 7: Launch backend & frontend
# ═══════════════════════════════════════════════════════════
step "Step 7/7 — Launching application"

# Start Backend
log "Starting FastAPI backend..."
cd "$ROOT_DIR/backend"
"$ROOT_DIR/venv/bin/uvicorn" app.main:app --reload --port 8000 &
BACKEND_PID=$!
sleep 2

if kill -0 "$BACKEND_PID" 2>/dev/null; then
    ok "Backend running on http://localhost:8000 (PID $BACKEND_PID)"
else
    fail "Backend failed to start. Check errors above."
    exit 1
fi

# Start Frontend
log "Starting React frontend..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
sleep 3

if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    ok "Frontend running on http://localhost:5173 (PID $FRONTEND_PID)"
else
    fail "Frontend failed to start. Check errors above."
    exit 1
fi

# ═══════════════════════════════════════════════════════════
# READY!
# ═══════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  🚀 CiviSense AI is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}Frontend${NC}     →  ${CYAN}http://localhost:5173${NC}"
echo -e "  ${BOLD}Backend${NC}      →  ${CYAN}http://localhost:8000${NC}"
echo -e "  ${BOLD}API Docs${NC}     →  ${CYAN}http://localhost:8000/docs${NC}"
echo -e "  ${BOLD}Database${NC}     →  localhost:5433"
echo ""
echo -e "  ${BOLD}Demo Login:${NC}"
echo -e "    Admin   →  ${DIM}admin@civisense.ai${NC}   / ${DIM}admin123${NC}"
echo -e "    Officer →  ${DIM}officer@civisense.ai${NC} / ${DIM}officer123${NC}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop all services"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Open browser
open "http://localhost:5173" 2>/dev/null || true

# Keep alive — wait for background processes
wait
