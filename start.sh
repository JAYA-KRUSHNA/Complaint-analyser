#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  CiviSense AI — One-Command Startup
#  Usage:  ./start.sh
#  Stop:   Ctrl+C  (gracefully kills backend & frontend)
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
NC='\033[0m' # No Color

log()   { echo -e "${CYAN}[CiviSense]${NC} $1"; }
ok()    { echo -e "${GREEN}  ✔${NC} $1"; }
warn()  { echo -e "${YELLOW}  ⚠${NC} $1"; }
fail()  { echo -e "${RED}  ✖${NC} $1"; }

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

# ── 1. Check prerequisites ──────────────────────────────
log "${BOLD}Checking prerequisites...${NC}"

if ! command -v docker &>/dev/null; then
    fail "Docker is not installed. Please install Docker Desktop."
    exit 1
fi
ok "Docker installed"

if ! docker info &>/dev/null; then
    warn "Docker daemon not running — starting Docker Desktop..."
    open -a Docker
    while ! docker info &>/dev/null; do
        sleep 2
    done
    ok "Docker daemon started"
else
    ok "Docker daemon running"
fi

if [ ! -d "$ROOT_DIR/venv" ]; then
    fail "Python venv not found. Run: python -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt"
    exit 1
fi
ok "Python venv found"

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    fail "Frontend dependencies not installed. Run: cd frontend && npm install"
    exit 1
fi
ok "Frontend node_modules found"

# ── 2. Start PostgreSQL ─────────────────────────────────
echo ""
log "${BOLD}Starting PostgreSQL...${NC}"
docker-compose -f "$ROOT_DIR/docker-compose.yml" up -d db 2>&1 | grep -v "obsolete" || true

# Wait for DB to be healthy
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

# ── 3. Run Migrations ───────────────────────────────────
echo ""
log "${BOLD}Running database migrations...${NC}"
cd "$ROOT_DIR/backend"
"$ROOT_DIR/venv/bin/python" -m alembic upgrade head 2>&1 | tail -1
ok "Migrations up to date"

# ── 4. Start Backend ────────────────────────────────────
echo ""
log "${BOLD}Starting FastAPI backend on http://localhost:8000 ...${NC}"
cd "$ROOT_DIR/backend"
"$ROOT_DIR/venv/bin/uvicorn" app.main:app --reload --port 8000 &
BACKEND_PID=$!
sleep 2

if kill -0 "$BACKEND_PID" 2>/dev/null; then
    ok "Backend running (PID $BACKEND_PID)"
else
    fail "Backend failed to start. Check logs above."
    exit 1
fi

# ── 5. Start Frontend ───────────────────────────────────
echo ""
log "${BOLD}Starting React frontend on http://localhost:5173 ...${NC}"
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
sleep 3

if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    ok "Frontend running (PID $FRONTEND_PID)"
else
    fail "Frontend failed to start. Check logs above."
    exit 1
fi

# ── 6. Ready! ────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  🚀 CiviSense AI is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "  ${BOLD}Frontend${NC}   →  ${CYAN}http://localhost:5173${NC}"
echo -e "  ${BOLD}Backend${NC}    →  ${CYAN}http://localhost:8000${NC}"
echo -e "  ${BOLD}API Docs${NC}   →  ${CYAN}http://localhost:8000/docs${NC}"
echo -e "  ${BOLD}Database${NC}   →  localhost:5433"
echo -e ""
echo -e "  ${BOLD}Login${NC}      →  admin@civisense.ai / admin123"
echo -e ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop all services"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Open the browser to the landing page
open "http://localhost:5173" 2>/dev/null || true

# Keep the script alive — wait for background processes
wait
