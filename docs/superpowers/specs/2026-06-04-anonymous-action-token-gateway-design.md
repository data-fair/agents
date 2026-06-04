# Require anonymous-action token on anonymous gateway/summary calls

Date: 2026-06-04

## Problem

The gateway (`POST /api/gateway/:type/:id/v1/chat/completions`) and summary
(`POST /api/summary/:type/:id`) endpoints are the only unauthenticated,
cost-bearing entry points. Their anonymous branch (`if (!authenticated)`) is
gated **only** by an IP-hashed monthly quota (`assertRoleQuota('anonymous', …)`).
A script can call them freely up to that quota with no proof of human presence
and no per-IP issuance throttle. CORS does not help here — it only constrains
browsers, not scripts.

## Goal

Require anonymous callers to present a simple-directory **anonymous-action
token** on these two endpoints. This reuses SD's existing bot-prevention
mechanism: the token is issued from a per-IP rate-limited endpoint and is not
valid until a `notBefore` delay has elapsed. The agents API already trusts SD's
JWKS (`session.init(config.privateDirectoryUrl)` in `api/src/server.ts`), so it
can verify the token with no new infrastructure.

### Non-goals

- Does **not** touch the authenticated path (cookie/session auth unchanged).
- Does **not** attempt to enforce "UI-only / no scripting" (separate work).
- Honest limitation: an issued token is replayable until expiry (issuance is
  rate-limited, use is not). This is a bot/abuse **speed bump** for the
  anonymous path, not an airtight gate.

## Background (verified)

- SD endpoint: `GET /api/auth/anonymous-action`
  (`simple-directory/api/src/app.ts:77`). Rate-limited per IP. Returns the raw
  JWT string. Payload: `{ anonymousAction: true, validation: 'wait', id }`,
  signed RS256 with SD's rotating key, published via `/.well-known/jwks.json`.
- TTL/`notBefore` come from SD config `anonymousAction` (`expiresIn: '1d'`,
  `notBefore: '8s'` in prod; SD's own test config uses `0s`). Overridable via
  env `ANONYMOUS_ACTION_NOT_BEFORE`.
- Verification: `session.verifyToken(token)` (lib-node `session.ts`) decodes,
  fetches the signing key by `kid` from SD's JWKS, and `jwt.verify`s it
  (signature + `exp` + `nbf`). Throws `NotBeforeError` / `TokenExpiredError` /
  signature errors.
- Browser-reachable SD path: `window.__SITE_PATH + '/simple-directory'`
  (same prefix already used for theme CSS in `ui/index.html`).
- Anonymous UI caller: only `ui/src/composables/use-agent-chat.ts`.
  `ui/src/pages/_dev/summary.vue` uses `useSessionAuthenticated()`, i.e. it is
  authenticated-only and needs no client change.

## Design

### 1. Config (api)

Add `requireAnonymousActionToken: boolean`, default **true**.

- `api/config/type/schema.json`: new boolean property, `default: true`, add to
  `required`.
- `api/config/default.js`: `requireAnonymousActionToken: true`.
- `api/config/custom-environment-variables.js`: map to
  `REQUIRE_ANONYMOUS_ACTION_TOKEN` (config lib coerces via the schema's
  `x-ajv.coerceTypes`).
- Regenerate types: `npm run build-types`.
- Development config inherits `true` (so api tests exercise enforcement).

### 2. Server verification (api) — new isolated module

`api/src/anonymous-token/service.ts`:

```
export async function assertAnonymousActionToken (req): Promise<void>
```

Behavior:
1. If `!config.requireAnonymousActionToken` → return (no-op).
2. Read header `x-anonymous-token`. Missing/empty →
   `throw httpError(401, 'anonymous action token required')`.
3. `const decoded = await session.verifyToken(token)` inside try/catch:
   - `NotBeforeError` → `httpError(401, 'anonymous action token not yet valid')`
   - `TokenExpiredError` → `httpError(401, 'anonymous action token expired')`
   - anything else → `httpError(401, 'invalid anonymous action token')`
4. `if (decoded?.anonymousAction !== true) throw httpError(401, 'invalid anonymous action token')`.

`session` is imported from `@data-fair/lib-express` (singleton already
initialized in `server.ts`).

Call site in **both** routers, inside the existing `if (!authenticated)` branch,
**after** `assertRoleQuota('anonymous', quotas)` so an anonymous-disabled owner
still returns 403 regardless of token:

```
if (!authenticated) {
  assertRoleQuota('anonymous', quotas)
  await assertAnonymousActionToken(req)
  …
}
```

Authenticated requests never read the header.

### 3. Client (ui)

New `ui/src/composables/use-anonymous-token.ts`:
- Module-level memoized in-flight promise + cached token string.
- `getAnonymousToken(): Promise<string>` — fetch
  `window.__SITE_PATH + '/simple-directory/api/auth/anonymous-action'`
  (response is the raw token), cache, return. Concurrent callers share the
  in-flight promise.
- `resetAnonymousToken()` — clear cache + in-flight promise (used on 401).

`use-agent-chat.ts`:
- Use `useSession()`; treat `!session.user.value` as anonymous.
- **Only when anonymous**: prefetch via `getAnonymousToken()` at composable init
  (so the `notBefore` window elapses while the user types) — fire-and-forget,
  errors swallowed (the request path will retry/surface).
- Provide a `fetch` wrapper to `createOpenAI` that is applied **whenever
  anonymous** (composing with the existing tracing wrapper when a recorder is
  present; today the tracing fetch is only attached when `recorder` is set):
  1. ensure token (`await getAnonymousToken()`), set `x-anonymous-token` header,
  2. delegate to the tracing fetch (if recorder) else global `fetch`,
  3. on `401` response: `resetAnonymousToken()`, refetch, retry **once**.
- When authenticated: behavior unchanged (no token fetch, no header) — preserves
  "do not create anonymous-action tokens when authenticated".

No change to `_dev/summary.vue` (authenticated-only).

### 4. Dev/test infra

`docker-compose.yml` `simple-directory` service env: add
`ANONYMOUS_ACTION_NOT_BEFORE: 0s` so api/e2e tests need not wait 8s.

### 5. Tests

`tests/support/axios.ts`: add `getAnonymousActionToken()` →
`anonymousAx.get(directoryUrl + '/api/auth/anonymous-action')`, returns token.

`tests/features/gateway/gateway.api.spec.ts` and
`tests/features/summary/summary.api.spec.ts`:
- Update existing anonymous cases to send `x-anonymous-token` (with `notBefore
  0s`, no wait needed).
- New cases:
  - anonymous + **missing** token → 401
  - anonymous + **garbage** token → 401
  - anonymous + **valid** token → success (existing happy path)
- Authenticated cases: unchanged (no header), confirm still pass.

Verification is JWKS/network-dependent, so it is covered by api tests rather
than a pure unit test.

## Files touched

- `api/config/type/schema.json`, `api/config/default.js`,
  `api/config/custom-environment-variables.js` (+ regenerated
  `api/config/type/index.ts`)
- `api/src/anonymous-token/service.ts` (new)
- `api/src/gateway/router.ts`, `api/src/summary/router.ts`
- `ui/src/composables/use-anonymous-token.ts` (new)
- `ui/src/composables/use-agent-chat.ts`
- `docker-compose.yml`
- `tests/support/axios.ts`,
  `tests/features/gateway/gateway.api.spec.ts`,
  `tests/features/summary/summary.api.spec.ts`

## Quality checks

`npm run lint-fix`, `npm run check-types`, `npm run test`, `docker build -t agents .`
