# Superadmin trace evaluation via a promoted account evaluator

Date: 2026-06-19
Branch: `feat-adminmode-evaluator`

## Problem

Superadmins review traces across **any** account (the `admin/*` trace-review pages). Today the
`EvaluatorChat` is wired to the **trace owner's** account, so every evaluator message — and every
`summarizeRequest` tool call — hits an endpoint scoped to that owner:

- the evaluator LLM call goes to `POST /gateway/:owner.type/:owner.id/v1/chat/completions`;
- the summarizer tool call goes to `POST /summary/:owner.type/:owner.id`.

Both run through the shared `resolveUsageIdentity` / `enforceQuotas` path in
`api/src/usage/enforce.ts`, which resolves the model from the owner's settings (owner's provider
API key), enforces the owner's quotas, and records cost against the owner via `recordUsage`.

The result: a superadmin reviewing account X consumes account X's tokens, quota and provider
budget. We want superadmin review to never charge the reviewed account.

## Decisions (from brainstorming)

1. **Resourcing** — reuse the evaluator already configured in one designated "main org" account
   (its model, provider, API key) and "promote" it for superadmin sessions. No separate
   global provider/key config block.
2. **Source account** — identified by a configured account id: `config.evaluatorAccount`.
3. **Cost accounting** — the source account is consumed like any normal session: **record usage
   and apply quotas** on it. No special "skip billing" branch.
4. **Unconfigured fallback** — if `config.evaluatorAccount` is unset or that account has no
   evaluator model, **disable the evaluator chat** in the superadmin review path with a hint.
5. **Privilege gate** — authorize on `user.adminMode` (the toggle), matching the branch name and
   the settings-PUT gate. Consuming another account's budget stays a deliberately guarded action.

## Approach

No new endpoint and no proxy. The client points the superadmin `EvaluatorChat` at the source
account, and the server grants admin-mode superadmins the right to consume any account's gateway.
Because `enforce.ts` is shared by the gateway and summary routers, a single server change covers
both the evaluator and the summarizer calls.

### 1. Server — authorize admin-mode superadmins on any gateway/summary call

In `resolveUsageIdentity` (`api/src/usage/enforce.ts`), authenticated path: when
`sessionState.user?.adminMode === true`, short-circuit before the normal
`assertCanUseModel` / `getEffectiveRole` logic and return an identity that treats the caller as an
**admin of the owner**:

```ts
if (session.user?.adminMode) {
  const trackPerUser = owner.type === 'organization'
  return {
    trackPerUser,
    usageUserId: trackPerUser ? session.user.id : undefined,
    usageUserName: trackPerUser ? session.user.name : undefined,
    role: 'admin',
    isUntrusted: false
  }
}
```

Consequences, all via the existing downstream code (no other gateway/summary changes):

- `assertCanUseModel` is bypassed, so authorization no longer depends on the superadmin being a
  member of the owner account.
- `enforceQuotas` still runs: the owner's account-wide `global` quota and its `admin` role quota
  both apply (decision 3 — "apply quotas"). With the default `admin` quota (`unlimited`) only the
  `global` cap bites; an operator can cap the source org's `admin` quota to bound review spend.
- `recordUsage` records cost on the owner (the source account for review), attributed to the
  superadmin's `user.id` for organization-type accounts.
- This privilege is general ("superadmins can consume all gateways"), not evaluator-specific — an
  intentional consequence of the chosen simplification.

`getEffectiveRole` is unchanged; the admin-mode branch never calls it.

### 2. Config

`api/config/default.js`:

```js
evaluatorAccount: null // or { type: 'organization', id: '<id>' }
```

`api/config/custom-environment-variables.js`: map `EVALUATOR_ACCOUNT_TYPE` and
`EVALUATOR_ACCOUNT_ID` (a value is "set" only when both are present). Add to `api/config/type` if a
typed config exists there.

### 3. Expose to the UI (admin-gated)

The superadmin UI needs (a) the source account's `type`/`id` to build the gateway/summary URLs and
(b) whether the promoted evaluator is actually usable. Extend the admin `/info` route
(`api/src/admin/router.ts`, already behind `reqAdminMode`) to also return:

- `evaluatorAccount: { type, id } | null` — straight from config;
- `evaluatorAvailable: boolean` — `true` only when `config.evaluatorAccount` is set **and**
  `getRawSettings(config.evaluatorAccount)?.models?.evaluator?.model` exists.

(The handler becomes async to read settings; build-`info` stays as today.)

### 4. UI wiring

- The superadmin trace-review page (`ui/src/pages/admin/[type]/[id]/traces/[convId].vue` →
  `TraceReview.vue`) fetches the admin `/info` fields and, when `evaluatorAvailable`, passes
  `evaluatorAccount.type` / `evaluatorAccount.id` as `EvaluatorChat`'s `accountType` / `accountId`
  (instead of the reviewed `owner`). Because `EvaluatorChat` already feeds those into both
  `useAgentChat` (gateway URL) and `buildEvaluatorTools` (summary URL), both the evaluator and the
  summarizer calls then target the source account. The reviewed account is never called.
- When `!evaluatorAvailable` **or** the session is not in admin mode (`!user.adminMode`), the
  `EvaluatorChat` input is hidden/disabled with a hint:
  - not configured → "Set `config.evaluatorAccount` (with an evaluator model) to enable trace
    review on this instance.";
  - configured but admin mode off → "Enable admin mode to review traces."
  The trace view itself still renders.
- The trace data still loads via the existing admin-gated trace endpoints (unchanged); only the
  evaluator's compute source moves.
- The non-superadmin account-admin review path (`ui/src/pages/[type]/[id]/traces/[convId].vue`) is
  unchanged: those admins keep using their own account's evaluator and consume their own budget.

## Out of scope / non-goals

- No change to the normal account-scoped review path or to account-admin billing.
- No new evaluator UI beyond the enable/disable + hint state.
- No per-review cost cap beyond the source account's existing quotas.
- No evaluator-specific authorization endpoint; the admin-mode privilege is intentionally general.

## Testing

**api** (`tests/features/...`, mock provider + `evaluator-mock` model):
- Gateway/summary scoped to an account the caller is **not** a member of:
  - admin mode **off** → 403 (unchanged behavior);
  - admin mode **on** → succeeds, records usage on that account under the superadmin's id, and
    enforces that account's `global`/`admin` quotas (429 when the global cap is exceeded).
- `/info` reports `evaluatorAccount` and `evaluatorAvailable` correctly for: unset config; config
  set but no evaluator model; config set with an evaluator model.

**e2e**:
- Superadmin (admin mode on) reviewing another account: evaluator chat is enabled and answers;
  network calls target `config.evaluatorAccount`, not the reviewed account.
- `evaluatorAvailable === false`: chat input hidden, hint shown, trace view still works.
- Admin mode off on a configured instance: hint to enable admin mode.

## Files touched (anticipated)

- `api/src/usage/enforce.ts` — admin-mode identity branch.
- `api/config/default.js`, `api/config/custom-environment-variables.js` (+ `api/config/type`) —
  `evaluatorAccount`.
- `api/src/admin/router.ts` — `/info` gains `evaluatorAccount` + `evaluatorAvailable`.
- `ui/src/pages/admin/[type]/[id]/traces/[convId].vue` and/or `ui/src/components/TraceReview.vue` —
  pass `evaluatorAccount` to `EvaluatorChat`, gate on availability + admin mode.
- Tests under `tests/features/`.
