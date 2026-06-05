# Trace rework: always-on tracing, user-visible info dialog, admin trace-review page

Date: 2026-06-05
Status: approved (pending spec review)

## Goal

Make trace analysis natural and applicable to a conversation *after the fact*, without
the current pre-decide-and-reload friction. Tracing becomes always-on for every user,
every user can inspect and download their own trace, and admins get a dedicated
trace-review page that pairs the trace view with an AI evaluator chat.

Persistence model is unchanged: traces stay **in-memory and ephemeral**. The download
(JSON file) and a transient localStorage handoff are the only ways a trace crosses a
reload or tab boundary — nothing is retained server-side or persisted long-term on the
client.

## Decisions (locked during brainstorming)

- **Always-on recorder** for all users; the `agent-chat-trace` sessionStorage gate and
  the start/stop-tracing + reload flow are removed.
- **No evaluator chat in the main chat UI.** It moves to the new review page only.
- **Full trace visible to every user** (no role-trimmed view). It is the user's own
  session data; no server secrets (API keys live server-side) are exposed.
- **Trace → review handoff via a transient localStorage bridge** (write on click, delete
  on read), with a download fallback when the trace exceeds the storage quota.
- Default labels/choices: dialog button label is **"Info"**; the evaluator is rendered
  with the existing message/input subcomponents, not the full `AgentChat`.

## Architecture

### 1. Recorder always on — `ui/src/components/AgentChat.vue`

- Instantiate `const recorder = new SessionRecorder()` unconditionally and always pass it
  to `useAgentChat`.
- Remove `tracingEnabled`, the `agent-chat-trace` sessionStorage read, and the
  evaluator-tab apparatus: `evaluatorChat`, `activeChatTab`, and the `active*` computeds
  (`activeMessages/activeStatus/activeError/activeSendMessage/activeAbort`). The component
  binds directly to the single `chat` instance again.
- Keep `setSystemPrompt` on init and in the existing `watch(finalSystemPrompt, …)`.

### 2. Drop `debug` prop, introduce `isAdmin`

- The `debug` prop is really "privileged view." Rename it to `isAdmin`, still computed in
  `ui/src/pages/[type]/[id]/chat.vue` from `session` + account role (the existing
  `chat.vue:46` expression).
- `isAdmin` now gates only: the "Open in trace review" link in the info dialog, and the
  experimental `toolExploration` (`agent-chat-explore`) flag. Tracing no longer depends on
  it.

### 3. Info dialog — rename of `AgentChatDebugDialog.vue`

- Header button + dialog title become **Info** (i18n `Informations` / `Info`).
- The trace tab's overview/detail content is extracted into a reusable `TraceView.vue`
  (section 4); the dialog embeds `<TraceView :recorder="recorder" />`.
- Add a **Download** button: `Blob` of `serializeTrace(recorder.getTrace())`, filename
  `trace-<ISO timestamp>.json`.
- When `isAdmin`, add an **Open in trace review** button (section 7).
- Remove the start/stop-tracing buttons, the reload, and the `tracingDisabled` empty state.

### 4. `TraceView.vue` (new, shared)

- One component used by both the info dialog and the review page.
- Prop: a `SessionRecorder`. It renders the existing overview expansion panels plus lazy
  `getTraceEntry` detail loading — logic lifted verbatim from the current debug dialog's
  trace tab.
- Live chat passes its live recorder; the review page passes a recorder hydrated via
  `SessionRecorder.fromTrace`. Same component, no branching on source.

### 5. Recorder serialization — `ui/src/traces/session-recorder.ts`

- `serializeTrace(trace: SessionTrace): string` — `JSON.stringify` (Date fields become ISO
  strings).
- `SessionRecorder.fromTrace(trace): SessionRecorder` — static factory that adopts a parsed
  `SessionTrace`, **reviving `Date` fields** on turns, steps, tool calls, physical requests,
  and tool-change events, and resetting the cached overview/detail indices so they rebuild
  lazily. This is the seam that lets `buildEvaluatorTools` run against an uploaded trace.

### 6. Review page — `ui/src/pages/[type]/[id]/trace-review.vue` (admin only)

- Route guard: a non-admin (for this account) is redirected / shown 403.
- Layout: **left** = `<TraceView :recorder="loadedRecorder" />`; **right** = evaluator chat.
- Trace source resolution on mount:
  1. Read the localStorage handoff key. If present: parse → `SessionRecorder.fromTrace` →
     **delete the key**.
  2. Otherwise the view is empty until the **Upload** button (file input → read JSON →
     validate shape → `fromTrace`).
- Evaluator chat:
  `useAgentChat({ accountType, accountId, localTools: buildEvaluatorTools(recorder, { accountType, accountId, apiPath }), modelName: 'evaluator', systemPrompt: EVALUATOR_PROMPT })`,
  rendered with the existing `AgentChatMessages` + `AgentChatInput` (not the full
  `AgentChat`, which carries iframe/action/d-frame baggage irrelevant here).
- `EVALUATOR_PROMPT` moves out of `AgentChat.vue` into a shared module (e.g.
  `ui/src/traces/evaluator-prompt.ts`) so both former and new call sites can import it; in
  practice only the review page uses it now.

### 7. Handoff data flow

```
[info dialog] click "Open in trace review"
  try {
    localStorage.setItem('agent-chat-trace-handoff', serializeTrace(recorder.getTrace()))
  } catch (quota) {
    triggerDownload(); // fallback
  }
  window.open(`${base}/${type}/${id}/trace-review`, '_blank')   // full page, new tab

[review page] onMounted
  const raw = localStorage.getItem('agent-chat-trace-handoff')
  if (raw) { recorder = SessionRecorder.fromTrace(JSON.parse(raw)); localStorage.removeItem(key) }
```

- The localStorage write is transient (removed on read), preserving the ephemeral stance.
- Multi-MB sessions can exceed the ~5MB localStorage cap; the quota `catch` falls back to a
  download + opening the review page empty for manual upload.

## Error handling

- **Upload**: invalid JSON or a payload missing `turns` / `physicalRequests` arrays → inline
  error, no recorder swap.
- **Handoff quota**: `try/catch` around `setItem` → download fallback.
- **Date revival**: defensive — tolerate already-`Date` and string values.

## Components & responsibilities

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `SessionRecorder` (+`fromTrace`/`serializeTrace`) | record + serialize + hydrate trace | trace types |
| `TraceView.vue` | render a recorder's overview + detail | `SessionRecorder` |
| Info dialog (renamed) | per-session info + download + admin review link | `TraceView`, `recorder` |
| `trace-review.vue` | admin page: load trace (handoff/upload) + evaluator chat | `TraceView`, `useAgentChat`, `buildEvaluatorTools`, `evaluator-prompt` |
| `AgentChat.vue` | main chat, always-on recorder, no evaluator | `useAgentChat`, `SessionRecorder` |

## Testing

- **Unit**: `serializeTrace` → `fromTrace` round-trip — Dates revived to `Date`, overview
  rebuilds to the same entries; malformed-payload validation rejects.
- **E2E**:
  1. Any user opens the Info dialog and downloads a trace file.
  2. Admin opens the review page, uploads that file, sees `TraceView` populated, and
     exchanges a message with the evaluator (mock provider configured as the `evaluator`
     model).

## What this deletes (simplification)

- `AgentChat.vue`: the evaluation tab, `evaluatorChat`, and all `active*` computeds.
- The start/stop-tracing buttons, reload flow, and the `agent-chat-trace` sessionStorage
  gate in the dialog.

## Out of scope

- Server-side persistence / retention of traces.
- Role-trimmed (non-admin) trace views.
- Changes to the `/summary` endpoint or `buildEvaluatorTools` tool set beyond accepting a
  hydrated recorder.
