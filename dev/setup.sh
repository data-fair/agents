#!/usr/bin/env bash
# Idempotent builds needed before the dev processes and the tests: generated types, workspace packages, ui build. No containers.
# Usage: npm run dev-setup
set -euo pipefail
cd "$(dirname "$0")/.."

# the api .type modules are committed, the shared ones are generated
[ -d shared/agent-session-client-frame/.type ] || npm run build-types
[ -f lib-vuetify/index.js ] || npm run build-libs
[ -f ui/dist/index.html ] || npm -w ui run build
