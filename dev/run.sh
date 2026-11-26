#!/usr/bin/env bash
# Minimal dev environment: dependencies, api, ui and dev MCP server, in one terminal. Ctrl+C stops them.
# Usage: npm run dev [-- <docker compose args, e.g. --profile events>]
set -euo pipefail
cd "$(dirname "$0")/.."

bash dev/deps.sh "$@"

# the global compose options (e.g. --profile events) given to dev/deps.sh also select the services seen here
compose_args=()
while [ $# -gt 0 ]; do
  case "$1" in
    --scale) shift 2 ;;
    --scale=*) shift ;;
    *) compose_args+=("$1"); shift ;;
  esac
done

set -a
. ./.env
set +a

# where the processes write their logs, dev/logs by default
log_dir=${DEV_LOG_DIR:-dev/logs}
log_prefix=${DEV_LOG_PREFIX:-}
mkdir -p "$log_dir"
set -m
pids=()
cleanup () {
  trap - EXIT INT TERM
  # each process runs in its own process group (set -m): stop npm and what it started
  for pid in "${pids[@]}"; do kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# an optional service is absent when its port variable is empty: blank the ones whose container does not run
running=$(docker compose ${compose_args[@]+"${compose_args[@]}"} ps --services --status running)
for entry in events:EVENTS_PORT; do
  if ! grep -qx "${entry%%:*}" <<< "$running"; then export "${entry##*:}="; fi
done

npm run dev:api < /dev/null > "$log_dir/${log_prefix}api.log" 2>&1 &
pids+=($!)
npm run dev:ui < /dev/null > "$log_dir/${log_prefix}ui.log" 2>&1 &
pids+=($!)
npm run dev:mcp < /dev/null > "$log_dir/${log_prefix}mcp.log" 2>&1 &
pids+=($!)

echo "logs in $log_dir (${log_prefix}api.log, ${log_prefix}ui.log, ${log_prefix}mcp.log)"
echo "dev server available at http://localhost:$NGINX_PORT/agents/"
# stop everything as soon as one process exits
wait -n || true
