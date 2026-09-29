#!/bin/bash

RANDOM_NB=$((1024 + RANDOM % 48000))
echo "Use random base port $RANDOM_NB"

cat <<EOF > ".env"
NGINX_PORT=$((RANDOM_NB))

DEV_API_PORT=$((RANDOM_NB + 1))
DEV_UI_PORT=$((RANDOM_NB + 2))
DEV_UI_HMR_PORT=$((RANDOM_NB + 3))
MAILDEV_UI_PORT=$((RANDOM_NB + 4))
MAILDEV_SMTP_PORT=$((RANDOM_NB + 5))

MONGO_PORT=$((RANDOM_NB + 10))

SD_PORT=$((RANDOM_NB + 20))
DF_PORT=$((RANDOM_NB + 21))
EVENTS_PORT=$((RANDOM_NB + 22))
EOF

# Render dev/resources/users.json from its committed template.
#
# docker-compose mounts that file straight into simple-directory, which reads it VERBATIM — it does
# no placeholder substitution of its own. A fixture that has to name a URL therefore cannot write
# the port literally, because the ports above are randomised per checkout: the autonomous-agent NHI
# fixtures declare their issuer as http://localhost:{NGINX_PORT}/agents/api/nhi and are resolved here.
#
# Only the rendered file is mounted, and it is gitignored; the template is the source of truth.
echo "Render dev/resources/users.json from users.template.json"
NGINX_PORT=$((RANDOM_NB)) node -e '
const { readFileSync, writeFileSync } = require("node:fs")
let raw = readFileSync("dev/resources/users.template.json", "utf8")
for (const [key, value] of Object.entries(process.env)) {
  if (value) raw = raw.replaceAll(`{${key}}`, value)
}
const unresolved = raw.match(/\{[A-Z_][A-Z0-9_]*\}/g)
if (unresolved) {
  // Fail loudly: an unresolved placeholder would reach simple-directory as a literal and only
  // surface later as an unexplained 401 from the token exchange.
  console.error("unresolved placeholders in users.template.json:", [...new Set(unresolved)].join(", "))
  process.exit(1)
}
writeFileSync("dev/resources/users.json", raw)
'
