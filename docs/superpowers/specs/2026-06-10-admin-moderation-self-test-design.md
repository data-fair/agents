# Admin moderation self-test — design

Date: 2026-06-10

## Problem

Moderation (LLM classification of each new user message, with possible
`content_filter` block) runs only for **untrusted** callers — `anonymous` and
`external` roles (`isUntrustedRole`, `api/src/usage/operations.ts`). Same-account
`admin`/`contrib`/`user` are trusted and skip moderation entirely
(`api/src/gateway/router.ts`: `if (identity.isUntrusted) { startModeration(...) }`).

An admin configuring the platform has no way to experience what an external user
actually sees before opening access. They cannot feel the moderation gate, see a
blocked message, or judge latency/false-positives from the user's seat.

## Goal

Let an **admin** opt themselves into the moderation gate, per browser, as a
testing aid — "show me what external users get." Scope is deliberately narrow:

- **In scope:** the moderation classification + gate (blocks surface as
  `content_filter`, exactly like the real untrusted path).
- **Out of scope:** strike accumulation / cooldown, the untrusted quota pool,
  recording the self-test into `moderation-events`, and any persistence beyond
  the admin's own browser.

The admin stays trusted for everything except the moderation gate.

## Approach

Chosen: a **separate `selfTestModeration` signal** on the usage identity, kept
distinct from `isUntrusted`.

Rejected alternatives:
- *Make the opted-in admin `isUntrusted = true`.* One line, but wrong: it pulls
  the admin into the shared untrusted quota pool (corrupting that accounting) and
  into strike/cooldown — the exact things we want excluded.
- *A separate dry-run moderation endpoint/path.* Duplicates the gate logic and
  drifts from the real untrusted path, defeating the purpose of testing the
  *real* experience.

## Design

### 1. Identity — `api/src/usage/enforce.ts`

`UsageIdentity` gains an optional `selfTestModeration?: boolean`.

In `resolveUsageIdentity`, authenticated **same-account** path only: set
`selfTestModeration = true` when `role === 'admin'` **and** the request carries
header `x-moderation-self-test: yes`. `isUntrusted` stays `false`; quotas, the
untrusted pool, and the cooldown gate are all untouched.

Only `admin` triggers it. The header is ignored for any other role — server-side
gate independent of the UI (defense in depth). Anonymous and external callers are
unaffected (they are already moderated; the field stays falsy for them).

### 2. Gateway — `api/src/gateway/router.ts`

Moderation trigger changes from:

```ts
if (identity.isUntrusted) {
```
to:
```ts
if (identity.isUntrusted || identity.selfTestModeration) {
```

and `startModeration` is called with `selfTest: identity.selfTestModeration`.
The strike-cooldown pre-check (line ~138) stays gated on `identity.isUntrusted`
only — self-test admins are never refused for cooldown.

### 3. Moderation run — `api/src/moderation/service.ts`

`startModeration(params)` accepts `selfTest?: boolean`. When `true`, `finalize`:

- **skips `recordEvent`** — self-tests stay out of `moderation-events`, so the
  admin-facing stats / fail-open metrics keep reflecting only real untrusted
  traffic (same "don't pollute the stats" principle as `runProbe`). This also
  sidesteps the `ModerationEvent.role: 'anonymous' | 'external'` typing, which an
  `admin` role would violate.
- **skips `registerBlockStrike`** — no strikes (per scope).

Everything else is unchanged: the gate race + timeout, verdict cache, trace
embedding, and **moderator-model cost metering** (real spend, billed at account
level via the admin's normal usage identity — `poolId` is undefined so it does
not touch the untrusted pool).

Net effect: a block still resolves the gate to `block`, so the admin sees the
`content_filter` finish exactly as an external user would.

### 4. UI toggle — `AgentChatDebugDialog.vue` (Settings tab) + `AgentChat.vue`

Add an admin-only **"Moderation self-test"** switch beside the existing
tool-exploration toggle, persisted in localStorage key
`agent-chat-moderation-self-test`, mirroring the `agent-chat-explore` pattern.
Flipping it does **not** reset the conversation — it only affects subsequent
messages (decided during brainstorming).

### 5. Header injection — `ui/src/composables/use-agent-chat.ts`

The existing header builder (`traceHeaders`) reads the localStorage flag
per-request (like `readConsent()`) and adds `x-moderation-self-test: yes` when
set. Per-request read means no extra reactivity/plumbing through the composable.

## Data flow

```
admin toggles switch ──> localStorage[agent-chat-moderation-self-test] = '1'
next message ──> traceHeaders() adds  x-moderation-self-test: yes
gateway ──> resolveUsageIdentity: role==admin && header  => selfTestModeration=true
         ──> startModeration({ selfTest: true })
                 classify → gate → (block ⇒ content_filter)
                 finalize: NO event, NO strike; cost metered at account level
```

## Testing

- **Unit** (`api/src/usage/operations` / `enforce` level where feasible):
  `selfTestModeration` is true only for `admin` + header, false for the header
  without admin role, false for admin without the header, and `isUntrusted`
  remains false in all these cases.
- **API** (gateway): an admin request with `x-moderation-self-test: yes` and a
  message the mock moderator blocks returns a `content_filter` finish; the same
  request without the header is not moderated; assert **no** `moderation-events`
  row and **no** strike are written for the self-test block; assert the untrusted
  pool usage is not incremented.
- **E2E** (optional, lightweight): the toggle appears in the debug dialog only
  for admins and persists across reload.

## Risks / notes

- The verdict cache is keyed by `owner + message`, shared with real untrusted
  traffic — intended (consistent behavior), self-test does not corrupt it.
- Moderator cost is real and billed to the account; acceptable for a deliberate
  admin testing action, consistent with `runProbe`.
