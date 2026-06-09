# Agents activity monitoring & trace-review simplification — design

Date: 2026-06-09
Repos: `agents` (this worktree) and `data-fair` (worktree `../data-fair_feat-agents-suivi`, branch `feat-agents-suivi`)

## Background

The agents chat runs inside an iframe that `data-fair` embeds (via `lib-vue`/`lib-vuetify`,
the `@data-fair/lib-*-agents` packages). Today the chat records the live conversation in the
browser (`SessionRecorder`) to power an in-chat "trace" tab, download/handoff, and an admin
trace-review page (`ui/src/pages/[type]/[id]/trace-review.vue`) that also supports uploading a
trace file. Separately, the gateway already persists conversation traces server-side
(`mongo.traceRequests`) for users who consented, with a 30-day TTL.

This duplication (client recorder + server store) is unnecessary, and there is no place for an
account admin to monitor agent activity. This change removes the client-side recording/upload
path, makes the **stored** trace the single source of truth for review, and adds an account-admin
activity page surfaced in data-fair's "Suivi" (monitor) section.

## Goals

- Remove the in-browser live recorder, the chat "trace" tab, trace download/handoff, and trace upload.
- Keep the trace **viewer** (`TraceView`), the **evaluator** (`EvaluatorChat` + evaluator model role/prompt/tools), and **reconstruction** (`reconstruct-trace`) — fed only from stored traces.
- Add an account-admin, read-only **activity** page: read-only config + limits + a paginated trace list.
- Turn trace review into a per-trace page `/traces/:id/review`.
- Simplify the chat debug dialog to two tabs: **Info** and **Settings**.
- Surface the activity page in data-fair's monitor ("Suivi") nav for account admins, and let the
  in-chat review link and the activity trace-list rows reach `/traces/:id/review`.

## Non-goals

- No change to gateway-side trace recording, consent, or the 30-day TTL.
- No change to the editable settings page (`/:type/:id/settings`) or its usage sections (additive only).
- No new evaluation features; the evaluator keeps its current behavior, only its data source changes.

## Permissions

- **Activity page** (`/:type/:id/activity`): any **admin of the account** (`canAdmin`), read-only.
- **Review page** (`/traces/:id/review`): admin of the trace's owning account (resolved server-side).
- **Settings page**: unchanged (superadmin / adminMode to edit).

---

## 1. Agents `ui/` — remove vs. keep

**Remove**

- Live recording in `AgentChat.vue`: stop instantiating/feeding a `SessionRecorder` during chat;
  stop passing a recorder to the debug dialog.
- Chat debug dialog **trace tab** and the live per-session token/cost usage display.
- Trace **download / handoff**: delete `ui/src/traces/trace-handoff.ts` and its uses
  (`downloadTrace`, `writeHandoff`, `readHandoff`, the dialog's Download / "Open review" buttons).
- Trace **upload** on the review page (file input, `onFile`, `isSessionTrace`).
- The old page `ui/src/pages/[type]/[id]/trace-review.vue` (replaced — see §3/§4).

**Keep**

- `ui/src/components/agent-chat/TraceView.vue`, `ui/src/components/EvaluatorChat.vue`,
  `ui/src/traces/evaluator-*`, `ui/src/traces/reconstruct-trace.ts`, `ui/src/traces/gateway-response.ts`.
- `ui/src/traces/session-recorder.ts`: **keep and trim** — retain `SessionRecorder.fromTrace()` and the
  read-only accessors `TraceView`/`EvaluatorChat` consume; delete the live-capture code paths that are
  no longer used.
- `ui/src/traces/trace-consent.ts` and the `x-trace-*` headers in `use-agent-chat.ts` (server records).
- The `evaluator` model role in settings.

## 2. Trace API (`api/src/traces/`)

- **Paginate the conversation list**: `GET /traces/:type/:id?page=&size=` → newest-first conversations
  (`{ results: [{ conversationId, preview, userName?, userId?, startedAt, requestCount }], count }`).
  Requester must be admin of `:type/:id` (unchanged auth).
- **Fetch one trace by conversation id** (for the account-less review route):
  `GET /traces/conversation/:conversationId` → the conversation's stored requests (same shape the
  current `GET /:type/:id/:conversationId` returns). The server reads the owner from the stored docs,
  asserts the requester is admin of that owner, and 404s if none exist.
  Note: this literal route is two segments like `GET /:type/:id`, so it must be **registered before**
  the `/:type/:id` param route (Express matches in definition order) or it will be shadowed.
- Keep `DELETE /:type/:id/:conversationId` and `DELETE /:type/:id?userId=` (per-conversation delete,
  per-user GDPR erase) — used by the activity page.

## 3. `/traces/:id/review` (agents route)

New page `ui/src/pages/traces/[id]/review.vue` (`:id` = `conversationId`):

- Fetch `GET /traces/conversation/:id` → `reconstructTrace(requests)` → `SessionRecorder.fromTrace(...)`
  → render existing `TraceView` + `EvaluatorChat`.
- Admin-only (server-enforced; client redirect on 403).
- No list, no upload, no handoff. Errors (404 / not-admin / load failure) shown inline.

## 4. Activity page (agents route `/:type/:id/activity`)

New page `ui/src/pages/[type]/[id]/activity.vue`, read-only, `canAdmin`. Additive — the editable
settings page and its usage sections are untouched. Sections:

- **Configuration (read-only)**: provider names/types (never API keys), model per role, quotas.
  Rendered from `GET /settings/:type/:id` (keys already obfuscated) as plain read-only summaries
  (not the vjsf edit form).
- **Limits & usage**: reuse `UsageCard` / `MonitoringGlobalSection` / `MonitoringIndividualSection`
  in read-only fashion.
- **Recent traces**: paginated list (`GET /traces/:type/:id?page=&size=`); each row links to
  `/traces/:id/review`; per-row delete and per-user erase actions retained here.

## 5. Chat debug dialog → two tabs

`ui/src/components/agent-chat/AgentChatDebugDialog.vue`:

- **Info**: system prompt, tools, and — when `isAdmin && traceStorageAvailable && consentRef === 'yes'`
  — a link to the current conversation's review (`/traces/:conversationId/review`). Because the chat is
  in an iframe, the link asks the host to navigate (existing frame navigation transport) rather than
  replacing the chat iframe.
- **Settings**: trace-storage consent toggle + tool-exploration toggle.
- Removed: trace tab, live token/cost usage, Download / Open-review buttons.

## 6. `data-fair` (`../data-fair_feat-agents-suivi`)

- **Monitor nav item** in the `monitor` group of `ui/src/composables/layout/use-navigation-items.ts`,
  gated by `$uiConfig.agentsIntegration && canAdmin`, pointing at a data-fair page that iframes the
  agents activity page — mirroring `ui/src/pages/admin/agents.vue` (`:src="/agents/${type}/${id}/activity"`,
  with `sync-path`). `sync-path` lets `/activity` and `/traces/:id/review` deep-link and reflect in the
  data-fair URL.
- The activity page's trace rows navigate (within the embedded iframe) to `/traces/:id/review`.
- The in-chat Info-tab review link triggers host navigation to the same embedded review location.
- i18n: add the nav title (e.g. "Suivi des agents" / "Agents activity").

## Testing

- **api**: pagination shape + ordering; `GET /traces/conversation/:id` resolves owner and authorizes
  (admin ok, non-admin 403, unknown id 404); delete/erase still work.
- **e2e (agents)**: activity page lists stored conversations for an admin and links to review;
  `/traces/:id/review` renders `TraceView` (+ evaluator) from a seeded stored trace; chat dialog shows
  exactly two tabs and the Info review link appears only for a consenting admin; upload/download/trace-tab
  are gone.
- **data-fair**: monitor nav item appears for an account admin when `agentsIntegration` is on and
  embeds the activity page.
- Trim does not break existing chat e2e (recorder removal).

## Removal checklist (quick reference)

- `ui/src/traces/trace-handoff.ts` — delete.
- `ui/src/pages/[type]/[id]/trace-review.vue` — delete (replaced by activity list + `/traces/:id/review`).
- `AgentChat.vue` — remove recorder instantiation/feeding.
- `AgentChatDebugDialog.vue` — remove trace tab, usage display, download/open-review; collapse to Info+Settings.
- `session-recorder.ts` — trim to `fromTrace` + read accessors.
