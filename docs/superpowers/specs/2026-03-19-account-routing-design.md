# Account Routing Design

## Problem

The gateway and summary APIs resolve the target account from `session.account`, preventing external users (e.g., portal users) from using an agent owned by another account. UI pages also lack account routing, so there is no way to navigate to another account's resources.

The settings API already uses `:type/:id` route params. Gateway, summary, and UI pages need the same pattern, with a role-based permission model that supports external access.

## Design

### Permission Model

A new helper `assertCanUseModel(session, owner, modelConfig)` in `api/src/auth.ts` controls access to gateway and summary endpoints. The check follows this ordered algorithm:

1. If the user is an admin of the owner account (`assertAccountRole` passes for `'admin'`) → **granted**.
2. If the user belongs to the owner account (`session.account.type === owner.type && session.account.id === owner.id`) AND the model's `roles` array is non-empty → **granted** (any member can use a model that has roles configured).
3. If the user is from a different account AND the model's `roles` array includes `"external"` → **granted**.
4. Otherwise → **denied** (403).

**Consequence:** an empty `roles` array means admin-only access. Adding any role value (e.g., `"user"`, `"contrib"`) opens the model to same-account members. Adding `"external"` additionally opens it to users from other accounts.

The `"external"` string in `roles` is the convention for cross-account access. No schema structural change is needed — `roles` is already `string[]`.

**Note:** the gateway currently has no role check at all — it only requires authentication and uses `session.account` directly. This change adds access control where there was none for cross-account scenarios.

### Endpoints — Access Control Matrix

| Endpoint | Params | Access |
|---|---|---|
| `GET/PUT /api/settings/:type/:id` | existing | admin only (unchanged) |
| `GET /api/models/:type/:id` | existing | admin only (unchanged) |
| `GET /api/usage/:type/:id` | existing | admin only (unchanged) |
| `POST /api/gateway/:type/:id/v1/chat/completions` | **add `:type/:id`** | role-based (`assertCanUseModel`) |
| `POST /api/summary/:type/:id` | **add `:type/:id`** | role-based (`assertCanUseModel`) |

### API Changes

#### Gateway (`api/src/gateway/router.ts`)

- The route changes from `/v1/chat/completions` to `/:type/:id/v1/chat/completions` inside the router. Mount path in `app.ts` stays `/api/gateway`.
- `owner` is read from `req.params` instead of `session.account`.
- Permission check: call `assertCanUseModel(session, owner, modelConfig)` after loading settings and resolving the model config for the requested model ID.
- The `isOrgContext` flag is replaced with `trackPerUser`: true whenever the user is not the sole account owner. This is the case when `owner.type === 'organization'` OR when the user is external (session account differs from owner). Specifically:
  - `userLimits` apply when `trackPerUser` is true and `settings.userLimits` is defined.
  - Account-level usage is fetched via `getOwnerUsage(owner)` when `trackPerUser` is true, via `getUsage(owner)` otherwise.
  - Usage is recorded with `userId = session.user.id` when `trackPerUser` is true.

#### Summary (`api/src/summary/router.ts`)

- Route changes from `POST /` to `POST /:type/:id`.
- `owner` from `req.params`.
- Permission check: `assertCanUseModel(session, owner, summarizerOrAssistantModelConfig)`.
- **Add quota enforcement** (currently absent in summary): same two-level pattern as gateway — check account limits, check user limits, record usage after completion.

### UI Changes

#### Route Structure

Pages move from flat to parameterized:

```
pages/
  index.vue                    → /agents/           (welcome, unchanged)
  [type]/[id]/
    settings.vue               → /agents/:type/:id/settings
    chat.vue                   → /agents/:type/:id/chat
```

#### Account Context

- Pages read `type` and `id` from `route.params`.
- API calls use these params to build URLs (e.g., `/api/gateway/${type}/${id}/v1/chat/completions`).
- The home page builds navigation links using `session.account.type` / `session.account.id` as the default target.

#### AgentChat Component (`ui/src/components/AgentChat.vue`)

- Receives the target account as a prop: `{ accountType: string, accountId: string }`.
- Passes these to the `useAgentChat` composable for gateway URL construction.
- The summary `$fetch` call at line ~530 also uses the target account params.

#### Composables

- `ui/src/composables/use-agent-chat.ts`: the base URL (currently `${$apiPath}/gateway/v1`) changes to `${$apiPath}/gateway/${accountType}/${accountId}/v1`. Receives `accountType` and `accountId` as parameters.
- `ui/src/composables/use-agent-evaluator.ts`: same pattern — gateway URL includes `accountType`/`accountId`.

#### Dev Pages

Pages under `pages/_dev/` that reference gateway or summary endpoints will need the same URL updates. These are development-only and can be updated to use a hardcoded test account or route params.

### Schema

No structural changes. The `roles` field on each model entry (`settings.models.assistant.roles`, etc.) is already `string[]`. The value `"external"` is the convention that opens access to users outside the owner account.

### Quota Enforcement for External Users

External users are subject to the same two-level quota system:

1. **Account-level limits** (`settings.limits`): checked against total account usage via `getOwnerUsage(owner)`.
2. **User-level limits** (`settings.userLimits`): checked against the external user's usage on this account, tracked by `session.user.id`.

Usage is always recorded with `userId = session.user.id` when `trackPerUser` is true (org context or external user). Internal and external users share the same `userLimits` configuration — there is no separate limit pool for external users.

### Error Handling

When settings do not exist for the target account, return a generic 404 (`"Agent not configured"`) to avoid account enumeration.
