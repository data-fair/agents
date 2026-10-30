#!/usr/bin/env bash
# Check the status of all dev environment services.
# Read-only — never starts, stops, or restarts anything.
# Safe to run from sandbox (only needs curl and .env).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load port configuration
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
else
  echo "ERROR: .env file not found at $PROJECT_DIR/.env"
  exit 1
fi

NGINX="http://localhost:${NGINX_PORT}"

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' RED='' YELLOW='' BOLD='' RESET=''
fi

check_http() {
  local name="$1" url="$2"
  local http_code
  http_code=$(curl -s -L --max-time 2 -o /dev/null -w "%{http_code}" "$url" 2>&1) || http_code="000"
  if [ "$http_code" = "000" ]; then
    printf "${RED}%-20s DOWN     %s  (connection refused)${RESET}\n" "$name" "$url"
  elif [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
    printf "${GREEN}%-20s UP       %s${RESET}\n" "$name" "$url"
  else
    printf "${YELLOW}%-20s ERROR    %s  (HTTP %s)${RESET}\n" "$name" "$url" "$http_code"
  fi
}

check_tcp() {
  local name="$1" host="$2" port="$3"
  if (echo > /dev/tcp/"$host"/"$port") 2>/dev/null; then
    printf "${GREEN}%-20s UP       %s:%s${RESET}\n" "$name" "$host" "$port"
  else
    printf "${RED}%-20s DOWN     %s:%s${RESET}\n" "$name" "$host" "$port"
  fi
}

echo -e "${BOLD}Dev environment status${RESET}"
echo ""

# --- Nginx (gateway to everything) ---
echo -e "${BOLD}Nginx proxy:${RESET}"
check_http "nginx" "$NGINX"
echo ""

# --- Dev processes (probed through nginx) ---
echo -e "${BOLD}Dev processes:${RESET}"
check_http "dev-api" "$NGINX/agents/api/ping"
check_http "dev-ui" "$NGINX/agents"
# Optional: only needed to run the workspace on Claude Code subscription models
# (npm run dev-bridge). DOWN here is normal unless you configured that provider.
# `${BRIDGE_PORT:?}` would abort the whole script under `set -e`, reporting nothing about
# simple-directory, mongo, the containers or the logs — on exactly the checkouts most likely to be
# broken, since every .env predating the seeded port lacks it. This is the tool AGENTS.md says to run
# first when something is down, so it must always finish. Equally it must not fall back to a fixed
# 3194, which would report another worktree's bridge as this one's.
if [ -n "${BRIDGE_PORT:-}" ]; then
  check_http "claude-bridge" "http://localhost:${BRIDGE_PORT}/_bridge/status"
else
  printf '%-20s %s\n' "claude-bridge" "SKIPPED (BRIDGE_PORT not in .env — re-run dev/init-env.sh)"
fi
# Serves the dev-review-*-mcp catalog entries (npm run dev-mcp). DOWN is normal unless you are
# working with autonomous agents — but then an agent wired to one of those entries fails with a 502
# when it gathers its tools, which is otherwise a confusing way to learn this is not running.
# Probed over TCP, not HTTP: the MCP endpoint answers only POST with a specific Accept header, so an
# HTTP probe reports 406 for a server that is perfectly healthy.
check_tcp "dev-mcp" "localhost" "$((NGINX_PORT + 31))"
echo ""

# --- Docker compose services (probed through nginx where possible) ---
echo -e "${BOLD}Docker compose services:${RESET}"
check_http "simple-directory" "$NGINX/simple-directory/"
check_http "events" "$NGINX/events/"
check_http "maildev" "http://localhost:${MAILDEV_UI_PORT}"
check_tcp  "mongo" "localhost" "${MONGO_PORT}"
echo ""

# --- Docker compose status (if docker/podman available) ---
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  echo -e "${BOLD}Container details:${RESET}"
  (cd "$PROJECT_DIR" && docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null) || echo "(docker compose not available)"
  echo ""
fi

# --- Log files ---
echo -e "${BOLD}Log files:${RESET}"
found_logs=false
for log in "$PROJECT_DIR"/dev/logs/*.log; do
  [ -f "$log" ] || continue
  found_logs=true
  name=$(basename "$log")
  size=$(wc -c < "$log" 2>/dev/null || echo 0)
  mod=$(date -r "$log" "+%H:%M:%S" 2>/dev/null || echo "unknown")
  printf "  %-25s %6s bytes  (last modified: %s)\n" "$name" "$size" "$mod"
done
$found_logs || echo "  (no log files found)"
