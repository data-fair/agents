# OpenShell Sandboxing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up agent-agnostic sandboxing with NVIDIA OpenShell for AI coding agents working on data-fair/agents.

**Architecture:** OpenShell policy template with env var placeholders, generated at port assignment time by `dev/init-env.sh`. The `OPENSHELL_SANDBOX_POLICY` env var is set in `.env` so users just run `openshell sandbox create -- claude` directly. Agent configs (Claude Code, OpenCode) auto-allow tools but restrict destructive git operations.

**Tech Stack:** OpenShell (YAML policies, Landlock LSM), Bash (scripts), JSON (agent configs)

**Safety:** Agent configs are permissive (auto-allow tools) but guarded by a `PreToolUse` hook that checks for `OPENSHELL_SANDBOX_ID` env var. If an agent is launched outside OpenShell, the hook blocks all tool use with an error message. The var name is a bet on OpenShell setting it automatically — adjust if needed after testing inside a real sandbox (`env | grep -i openshell`).

**Usage:** After `dev/init-env.sh` has run, launch a sandboxed agent with:
```bash
source .env && openshell sandbox create -- claude
source .env && openshell sandbox create -- opencode
```

---

### Task 1: Create OpenShell Policy Template

**Files:**
- Create: `dev/openshell/policy.yaml.template`

- [ ] **Step 1: Create the template file**

```yaml
version: 1

filesystem_policy:
  include_workdir: true
  read_only:
    - /usr
    - /lib
    - /etc
    - /proc
    - /dev/urandom
    - /dev/stdin
    - /dev/stdout
    - /dev/stderr
    - /dev/tty
    - /var/log
    - /sandbox/..
  read_write:
    - /sandbox
    - /tmp
    - /dev/null

landlock:
  compatibility: best_effort

process:
  run_as_user: sandbox
  run_as_group: sandbox

network_policies:
  dev_nginx:
    endpoints:
      - host: localhost
        port: ${NGINX_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_api:
    endpoints:
      - host: localhost
        port: ${DEV_API_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_ui:
    endpoints:
      - host: localhost
        port: ${DEV_UI_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_ui_hmr:
    endpoints:
      - host: localhost
        port: ${DEV_UI_HMR_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_maildev_ui:
    endpoints:
      - host: localhost
        port: ${MAILDEV_UI_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_maildev_smtp:
    endpoints:
      - host: localhost
        port: ${MAILDEV_SMTP_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_mongo:
    endpoints:
      - host: localhost
        port: ${MONGO_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_sd:
    endpoints:
      - host: localhost
        port: ${SD_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_df:
    endpoints:
      - host: localhost
        port: ${DF_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  dev_events:
    endpoints:
      - host: localhost
        port: ${EVENTS_PORT}
        protocol: rest
        tls: false
    enforcement: enforce
    access: full
  npm_registry:
    endpoints:
      - host: registry.npmjs.org
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: full
  github:
    endpoints:
      - host: github.com
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: full
  anthropic_api:
    endpoints:
      - host: api.anthropic.com
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: full
  mdn_docs:
    endpoints:
      - host: developer.mozilla.org
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: read-only
  nodejs_docs:
    endpoints:
      - host: nodejs.org
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: read-only
  context7:
    endpoints:
      - host: mcp.context7.com
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: full
  vuetify_docs:
    endpoints:
      - host: vuetifyjs.com
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: read-only
  mcp_docs:
    endpoints:
      - host: modelcontextprotocol.io
        port: 443
        protocol: rest
        tls: terminate
    enforcement: enforce
    access: read-only
```

- [ ] **Step 2: Commit**

```bash
git add dev/openshell/policy.yaml.template
git commit -m "feat: add OpenShell policy template for agent sandboxing"
```

---

### Task 2: Update `dev/init-env.sh` to Generate Policy and Set Env Var

**Files:**
- Modify: `dev/init-env.sh`

- [ ] **Step 1: Add `OPENSHELL_SANDBOX_POLICY` to the .env heredoc**

Add this line at the end of the existing heredoc in `dev/init-env.sh`, before the `EOF`:

```
OPENSHELL_SANDBOX_POLICY=dev/openshell/policy.yaml
```

- [ ] **Step 2: Add policy generation after .env creation**

Append to the end of `dev/init-env.sh`, after the heredoc:

```bash
echo "Generate OpenShell policy"
set -a
source .env
set +a
envsubst '$NGINX_PORT $DEV_API_PORT $DEV_UI_PORT $DEV_UI_HMR_PORT $MAILDEV_UI_PORT $MAILDEV_SMTP_PORT $MONGO_PORT $SD_PORT $DF_PORT $EVENTS_PORT' < dev/openshell/policy.yaml.template > dev/openshell/policy.yaml
```

- [ ] **Step 3: Verify it works**

Run: `bash dev/init-env.sh`
Expected: `.env` contains `OPENSHELL_SANDBOX_POLICY=dev/openshell/policy.yaml` and `dev/openshell/policy.yaml` is generated with resolved port numbers.

Run: `grep -c '\${' dev/openshell/policy.yaml`
Expected: `0` (no unresolved variable placeholders)

- [ ] **Step 4: Commit**

```bash
git add dev/init-env.sh
git commit -m "feat: generate OpenShell policy from template in init-env.sh"
```

---

### Task 3: Add `.gitignore` Entry

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add generated policy to .gitignore**

Add this line to `.gitignore`:

```
dev/openshell/policy.yaml
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore generated OpenShell policy"
```

---

### Task 4: Update Claude Code Config

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Update settings.json**

Remove the `sandbox` section (OpenShell handles sandboxing). Keep all tool permissions auto-allowed. Add deny rules for destructive git operations. Allow `git clean -n` (dry run) and `git rebase --abort` (recovery) while blocking destructive variants. Add a `PreToolUse` hook that blocks all tool use if `OPENSHELL_SANDBOX_ID` is not set.

```json
{
  "permissions": {
    "allow": [
      "Bash",
      "Edit",
      "Write",
      "NotebookEdit",
      "WebFetch",
      "WebSearch",
      "mcp__*"
    ],
    "deny": [
      "Bash(git push*)",
      "Bash(git reset --hard*)",
      "Bash(git clean -f*)",
      "Bash(git clean -d*)",
      "Bash(git branch -D*)",
      "Bash(git rebase -i*)",
      "Bash(git rebase --onto*)",
      "Bash(git rebase main*)",
      "Bash(git rebase master*)"
    ]
  },
  "enableAllProjectMcpServers": true,
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "test -n \"$OPENSHELL_SANDBOX_ID\" || (echo 'ERROR: Not running inside OpenShell sandbox. Use: source .env && openshell sandbox create -- claude' >&2 && exit 1)"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/settings.json
git commit -m "feat: relax Claude Code sandbox, add sandbox guard hook

Removes built-in sandbox (OpenShell provides it). PreToolUse hook
blocks all tool use if OPENSHELL_SANDBOX_ID is not set, preventing
accidental use of permissive config outside the sandbox."
```

---

### Task 5: Create OpenCode Config and Sandbox Guard Plugin

**Files:**
- Create: `opencode.json`
- Create: `.opencode/plugins/sandbox-guard/index.ts`

- [ ] **Step 1: Create opencode.json**

OpenCode uses last-matching-rule-wins pattern ordering. Safe git operations are explicitly allowed, destructive ones denied. The sandbox guard plugin is loaded from the local plugins directory.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "allow",
      "git push": "deny",
      "git push *": "deny",
      "git reset --hard*": "deny",
      "git clean -f*": "deny",
      "git clean -d*": "deny",
      "git branch -D*": "deny",
      "git rebase -i*": "deny",
      "git rebase --onto*": "deny",
      "git rebase main*": "deny",
      "git rebase master*": "deny"
    },
    "edit": "allow",
    "write": "allow"
  }
}
```

- [ ] **Step 2: Create sandbox guard plugin**

This plugin uses the `tool.execute.before` hook to block all tool use if `OPENSHELL_SANDBOX_ID` is not set.

Note: there is a known limitation — `tool.execute.before` does not intercept subagent tool calls (see opencode issue #5894).

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const SandboxGuardPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async () => {
      if (!process.env.OPENSHELL_SANDBOX_ID) {
        throw new Error(
          "Not running inside OpenShell sandbox. Use: source .env && openshell sandbox create -- opencode"
        )
      }
    },
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add opencode.json .opencode/plugins/sandbox-guard/index.ts
git commit -m "feat: add OpenCode config with git safety rules and sandbox guard plugin"
```

---

### Task 6: Verification

- [ ] **Step 1: Verify worktree script calls init-env.sh**

Read `dev/worktree.sh` and confirm it calls `./dev/init-env.sh` (line 26) — which now generates both `.env` (with `OPENSHELL_SANDBOX_POLICY`) and the OpenShell policy. No changes needed.

- [ ] **Step 2: Verify all files are in place**

Run: `ls -la dev/openshell/`
Expected: `policy.yaml.template` and `policy.yaml`

Run: `cat opencode.json | head -5`
Expected: Valid JSON with schema reference

Run: `cat .claude/settings.json | head -10`
Expected: No sandbox section, has deny rules

- [ ] **Step 3: Verify .gitignore**

Run: `git status`
Expected: `dev/openshell/policy.yaml` is NOT listed (gitignored)

- [ ] **Step 4: Verify policy generation end-to-end**

Run: `bash dev/init-env.sh && grep -c '\${' dev/openshell/policy.yaml`
Expected: `0` (all variables resolved)

Run: `grep OPENSHELL_SANDBOX_POLICY .env`
Expected: `OPENSHELL_SANDBOX_POLICY=dev/openshell/policy.yaml`
