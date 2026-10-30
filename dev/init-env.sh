#!/bin/bash
set -euo pipefail

RANDOM_NB=$((1024 + RANDOM % 48000))
echo "Use random base port $RANDOM_NB"

NGINX_PORT=$((RANDOM_NB))
DEV_API_PORT=$((RANDOM_NB + 1))
DEV_UI_PORT=$((RANDOM_NB + 2))
DEV_UI_HMR_PORT=$((RANDOM_NB + 3))
MAILDEV_UI_PORT=$((RANDOM_NB + 4))
MAILDEV_SMTP_PORT=$((RANDOM_NB + 5))
# Seeded like every other dev process rather than defaulting to a fixed 3194: that default made
# every checkout fight for one port, so a second worktree's bridge simply failed to start.
BRIDGE_PORT=$((RANDOM_NB + 6))
MONGO_PORT=$((RANDOM_NB + 10))
SD_PORT=$((RANDOM_NB + 20))
DF_PORT=$((RANDOM_NB + 21))
EVENTS_PORT=$((RANDOM_NB + 22))

# Render dev/resources/users.json from its committed template.
#
# docker-compose mounts that file straight into simple-directory, which reads it VERBATIM — it does
# no placeholder substitution of its own. A fixture that has to name a URL therefore cannot write
# the port literally, because the ports are randomised per checkout: the autonomous-agent NHI
# fixtures declare their issuer as http://localhost:{NGINX_PORT}/agents/api/nhi and are resolved here.
#
# Only the rendered file is mounted, and it is gitignored; the template is the source of truth.
#
# Rendered BEFORE .env is written, and into a temp file moved into place only on success, so the two
# can never disagree: .env carrying new ports beside a users.json still holding the previous run's
# rendering would mount an issuer naming a dead port, and the exchange would fail with
# simple-directory's uniform 401 — exactly the outcome the loud failure below exists to prevent. That
# only held on a fresh checkout, where the rendered file happens to be absent.
echo "Render dev/resources/users.json from users.template.json"
RENDER_VALUES="$(cat <<EOF
{
  "NGINX_PORT": "$NGINX_PORT",
  "DEV_API_PORT": "$DEV_API_PORT",
  "DEV_UI_PORT": "$DEV_UI_PORT",
  "MAILDEV_UI_PORT": "$MAILDEV_UI_PORT",
  "BRIDGE_PORT": "$BRIDGE_PORT",
  "MONGO_PORT": "$MONGO_PORT",
  "SD_PORT": "$SD_PORT",
  "DF_PORT": "$DF_PORT",
  "EVENTS_PORT": "$EVENTS_PORT"
}
EOF
)"
RENDER_VALUES="$RENDER_VALUES" node -e '
const { readFileSync, writeFileSync, renameSync } = require("node:fs")
// Substituted ONLY from the values this run just computed, never from the ambient process.env: run
// from a shell that had exported the previous .env (a `dotenv --` wrapper, or a dev shell that
// sourced it), a placeholder would otherwise resolve to the PREVIOUS port, the guard below would not
// trip, and the result is the same silent 401.
const values = JSON.parse(process.env.RENDER_VALUES)
let raw = readFileSync("dev/resources/users.template.json", "utf8")
for (const [key, value] of Object.entries(values)) {
  // Escaped for the JSON string it lands in. Ports make this a no-op today; it means a future
  // non-numeric value cannot produce a users.json simple-directory fails to parse.
  const safe = String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"")
  raw = raw.replaceAll(`{${key}}`, safe)
}
// Case-insensitive on the name: a lowercase typo like {nginx_port} is still a placeholder, and would
// otherwise pass this guard and reach simple-directory literally.
const unresolved = raw.match(/\{[A-Za-z_][A-Za-z0-9_]*\}/g)
if (unresolved) {
  // Fail loudly: an unresolved placeholder would reach simple-directory as a literal and only
  // surface later as an unexplained 401 from the token exchange.
  console.error("unresolved placeholders in users.template.json:", [...new Set(unresolved)].join(", "))
  console.error("known values:", Object.keys(values).join(", "))
  process.exit(1)
}
// Parsed before being published: simple-directory reads this file with readFileSync at boot and a
// malformed one takes the container down, which is a worse failure than this one.
JSON.parse(raw)
writeFileSync("dev/resources/users.json.tmp", raw)
renameSync("dev/resources/users.json.tmp", "dev/resources/users.json")
'

cat <<EOF > ".env"
NGINX_PORT=$NGINX_PORT

DEV_API_PORT=$DEV_API_PORT
DEV_UI_PORT=$DEV_UI_PORT
DEV_UI_HMR_PORT=$DEV_UI_HMR_PORT
MAILDEV_UI_PORT=$MAILDEV_UI_PORT
MAILDEV_SMTP_PORT=$MAILDEV_SMTP_PORT

BRIDGE_PORT=$BRIDGE_PORT

MONGO_PORT=$MONGO_PORT

SD_PORT=$SD_PORT
DF_PORT=$DF_PORT
EVENTS_PORT=$EVENTS_PORT
EOF
