# OpenShell Sandboxing for AI Coding Agents

## Goal

Provide agent-agnostic, infrastructure-level sandboxing for AI coding agents (Claude Code, OpenCode, etc.) working on the data-fair/agents project using NVIDIA OpenShell.

## Architecture

OpenShell enforces filesystem and network isolation at the kernel level via Landlock LSM. Security policies are defined in YAML, generated dynamically from `.env` port assignments so they work for both main checkout and worktrees.

Each agent (Claude Code, OpenCode) gets a relaxed config file that removes friction (auto-allow tools) since OpenShell provides the security boundary. Git safety (no push, no destructive operations) is enforced at the agent config level.

## Components

### 1. Policy Template (`dev/openshell/policy.yaml.template`)

Checked into git. Contains:

- **Filesystem read-write:** project directory (`/sandbox`)
- **Filesystem read-only:** parent directory (covers main `.git` for worktrees, sibling data-fair projects)
- **Filesystem read-only:** system paths (`/usr`, `/lib`, `/etc`, `/proc`, `/dev/urandom`)
- **Network localhost:** ports from `.env` substituted at generation time
- **Network allowlist:** `registry.npmjs.org`, `github.com`, `api.anthropic.com`, `developer.mozilla.org`, `nodejs.org`, `mcp.context7.com`, `vuetifyjs.com`, `modelcontextprotocol.io`
- **Process:** sandbox user, Landlock best_effort

### 2. Policy Generation (in `dev/init-env.sh`)

After generating `.env`, also generates `dev/openshell/policy.yaml` by substituting env vars into the template. Uses `envsubst`.

### 3. Usage via `OPENSHELL_SANDBOX_POLICY` env var

`init-env.sh` also writes `OPENSHELL_SANDBOX_POLICY=dev/openshell/policy.yaml` into `.env`. Users source `.env` and run OpenShell directly:
```bash
source .env && openshell sandbox create -- claude
source .env && openshell sandbox create -- opencode
```
No wrapper script needed.

### 4. Claude Code Config (`.claude/settings.json`)

- Remove `sandbox.enabled` and `autoAllowBashIfSandboxed` (OpenShell handles sandboxing)
- Keep all permissions auto-allowed
- Add `denyBash` patterns for destructive git: `git push`, `git reset --hard`, `git clean`, `git branch -D`, `git rebase`

### 5. OpenCode Config (`opencode.json`)

- Auto-allow all tool operations
- Git permissions: allow safe operations, deny `git push`, `git reset --hard`, `git clean -f`, `git branch -D`, `git rebase`

### 6. `.gitignore`

Add `dev/openshell/policy.yaml` (generated artifact)

## Out of Scope

- Docker CLI access (dev env managed by user)
- Credential management (OpenShell injects from host env)
- Sandboxing the agents this project serves to users (separate concern)
