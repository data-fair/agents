#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
IMAGE_NAME="$(basename "$PROJECT_DIR")-sandbox"

AGENT="${1:-claude}"
shift 2>/dev/null || true

# Build image if it doesn't exist or if Containerfile changed
if ! podman image exists "$IMAGE_NAME" || \
   [ "$SCRIPT_DIR/Containerfile" -nt "$(podman image inspect "$IMAGE_NAME" --format '{{.Created}}' 2>/dev/null || echo 0)" ]; then
  echo "Building sandbox image..."
  podman build \
    --build-arg USER_UID="$(id -u)" \
    --build-arg USER_GID="$(id -g)" \
    -t "$IMAGE_NAME" \
    -f "$SCRIPT_DIR/Containerfile" \
    "$SCRIPT_DIR"
fi

# Collect API key env vars to forward
ENV_ARGS=()
for var in ANTHROPIC_API_KEY OPENAI_API_KEY OPENROUTER_API_KEY CLAUDE_CODE_USE_BEDROCK AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_REGION; do
  if [ -n "${!var:-}" ]; then
    ENV_ARGS+=(-e "$var=${!var}")
  fi
done

# Common podman run args
RUN_ARGS=(
  --rm -it
  --name "agents-sandbox-$$"
  -v "$PROJECT_DIR:/workspace:Z"
  -v "$HOME/.gitconfig:/home/node/.gitconfig:ro"
  -v "$HOME/.claude:/home/node/.claude:Z"
  -v "$HOME/.claude.json:/home/node/.claude.json:Z"
  -v "$HOME/.config/opencode:/home/node/.config/opencode:Z"
  -v "$HOME/.local/share/opencode:/home/node/.local/share/opencode:Z"
  -v "$HOME/.local/state/opencode:/home/node/.local/state/opencode:Z"
  -v "$HOME/.cache/ms-playwright:/home/node/.cache/ms-playwright:Z"
  --network=host
  --userns=keep-id
  "${ENV_ARGS[@]}"
)

# Generate merged opencode config with sandbox overrides
OPENCODE_SANDBOX_CONFIG=$(mktemp "${TMPDIR:-/tmp}/opencode-sandbox-XXXXXX.json")
jq -s '(.[0].permission // {}) as $p1 | (.[1].permission // {}) as $p2 | .[0] * .[1] | .permission = ($p1 * $p2)' "$PROJECT_DIR/opencode.json" "$SCRIPT_DIR/opencode-settings.json" > "$OPENCODE_SANDBOX_CONFIG"
RUN_ARGS+=(-v "$OPENCODE_SANDBOX_CONFIG:/workspace/opencode.json:ro")

trap "rm -f '$OPENCODE_SANDBOX_CONFIG'" EXIT

# Mount .env as read-only to prevent agents from modifying it
if [ -f "$PROJECT_DIR/.env" ]; then
  RUN_ARGS+=(-v "$PROJECT_DIR/.env:/workspace/.env:ro,Z")
fi

case "$AGENT" in
  build)
    echo "Sandbox image is up to date."
    exit 0
    ;;
  claude)
    podman run "${RUN_ARGS[@]}" "$IMAGE_NAME" -c "claude --settings /workspace/dev/sandbox/claude-settings.json $*"
    ;;
  opencode)
    podman run "${RUN_ARGS[@]}" "$IMAGE_NAME" -c "opencode $*"
    ;;
  shell)
    podman run "${RUN_ARGS[@]}" "$IMAGE_NAME"
    ;;
  *)
    echo "Usage: $0 {build|claude|opencode|shell} [args...]"
    echo ""
    echo "  build    - Build/update the sandbox image"
    echo "  claude   - Run Claude Code in sandbox"
    echo "  opencode - Run OpenCode in sandbox"
    echo "  shell    - Open a bash shell in sandbox"
    exit 1
    ;;
esac
