# Autonomous Agents P0-B (Identity & Tools) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An autonomous agent obtains a real simple-directory session as its own non-human identity, and uses it to list and call tools on the MCP servers it is configured with.

**Architecture:** This service becomes an NHI *issuer*: one ES256 keypair from the deployment's secret store, an OIDC discovery document and JWKS served at a stable issuer URL, and short-lived assertions minted per autonomous agent (`sub: autonomous-agent:<id>`). Those are exchanged at simple-directory's `POST /api/auth/nhi-token` for a session, whose `Set-Cookie` is captured into a per-agent jar and replayed as a `Cookie` header by an MCP `StreamableHTTPClientTransport` — because `@data-fair/lib-express` reads sessions from cookies only. Tools are listed at run start and wrapped as AI SDK tools.

**Tech Stack:** Node 24, Express 5, `jose` (ES256 sign + JWK export), `@modelcontextprotocol/sdk` (`StreamableHTTPClientTransport`), `ai` (tool wrapping), Playwright (`unit` / `api`).

**Spec:** `docs/superpowers/specs/2026-09-22-autonomous-agents-p0-design.md`

## Scope

Plan **B of three** for P0. Plan A (merged into this branch) delivered the `MCP_SERVERS` catalog and autonomous agent CRUD. Plan C delivers conversations, the executor, websockets, UI and traces — plus the `shared/` extraction.

**Deliverable, and the first externally observable behaviour of this whole feature:** an admin creates an autonomous agent, enrols its NHI, points it at a catalog server, and calls `GET /api/autonomous-agents/:type/:id/:agentId/tools` to see the real tool list fetched *as that agent's identity*. That endpoint (Task 6) is what makes this plan demonstrable in staging without an executor.

Still not possible after this plan: running an autonomous agent. There is no conversation, no executor and no UI until Plan C.

## Global Constraints

- **Naming:** "autonomous agent" written out in every identifier, route, collection and user-facing string. Never a bare `agent`. This service is called `agents` and its in-page assistant is already "the agent". Hyphenated prose compounds are the only exception.
- **Module conventions:** `operations.ts` = pure stateless functions, no `#mongo`, no `#config`, no in-memory state, no imports but other `operations.ts`. `service.ts` = stateful. `router.ts` = HTTP only, imported only by `app.ts`.
- **Types come from JSON schemas.** Edit the schema, run `npm run build-types`. Never hand-write a generated type.
- **Config ordering trap (cost Plan A a crashed dev-api):** the running dev-api validates its config against the **generated** validator, and `nodemon` does **not** watch `api/config/type/.type/`. So after editing `api/config/type/schema.json` or the config files, run `npm run build-types` immediately, then touch a watched file (e.g. `touch api/index.ts`) so nodemon reloads.
- **`ui/components.d.ts` is additive-only:** `build-types` adds entries and never prunes stale ones. Not expected to matter in this plan (no new schemas with vjsf exports), but check it if you add one.
- **Secrets never reach the model or a log:** the signing key, minted assertions and session cookies live in config and the transport layer only. Never in a prompt, a tool argument, a stored trace, or a `console.log`.
- **Quality gate before every commit:** `npm run lint-fix`, `npm run check-types`.
- **Dev processes are user-managed.** Never start, stop, restart or kill any dev process or container. If a test fails with a connection error, run `bash dev/status.sh`, report it, and STOP.
- **Tests go in `tests/features/autonomous-agents/`.** Note `tests/features/agents/` is the *in-page* assistant, a different feature.

## Prerequisites — MUST be satisfied before Task 3

These are environment and dependency changes. The first two require the **user** to restart a container; do not do it yourself.

1. **`docker-compose.yml`, `simple-directory` service — add two env vars** (Task 1 makes this edit; the user restarts):
   - `MANAGE_NHIS: true` — simple-directory's `manageNhis` defaults to `false`, which makes `POST /api/auth/nhi-token` and the NHI management endpoints return **404**. Verified absent from the current compose file.
   - `NHIS_ALLOW_INSECURE_ISSUERS: true` — `assertSafeIssuer` requires `https:` and a non-private host. The dev issuer is `http://localhost:…`, so without this every exchange fails. Dev only; never set in production.
   NHI support is confirmed present on simple-directory `master` (`api/src/nhis/`, commit `c0bf6ae`), so the `:master` image should carry it.
2. **Dependency moves** (Task 1):
   - `@modelcontextprotocol/sdk` moves from the **root** `devDependencies` to `api` `dependencies` — the runtime needs it, and the production image installs prod deps only. Version 1.30.0 already provides `dist/esm/client/streamableHttp.js`.
   - add `jose` to `api` `dependencies` at **`^6`**. Do not pin `^4`: the tree already resolves jose 4.15.9 (via `@data-fair/lib-express` → `jwks-rsa`) **and** 6.2.12 (via the MCP SDK), so `^6` dedupes with the SDK's copy instead of adding a third major.
3. **`bash dev/status.sh` shows every service UP** before running any api test.

## Key facts established before writing this plan

Do not re-derive these; they are verified.

- **The audience is the site origin.** `reqSiteUrl(req) = reqOrigin(req) + reqSitePath(req)`, and `reqSitePath` is empty for the main site. So the assertion's `aud` is the origin, e.g. `http://localhost:25475` in dev — computed as `new URL(config.publicUrl).origin`. (Multi-site deployments serving agents on a non-main site would need the site path appended; out of scope, note it in a comment.)
- **This service has no `publicUrl` config** — it learns its URL per request via `createSiteMiddleware`. An issuer URL must be stable and is needed in background runs with no request, so Task 1 adds `PUBLIC_URL`.
- **Sessions are cookie-only.** `@data-fair/lib-express/session.js` reads `id_token` / `id_token_sign` cookies and parses no `Authorization` header anywhere. The MCP client must replay `Set-Cookie` as `Cookie`.
- **A session lasts `min(assertion.exp, 30m)`.** A 300 s assertion therefore buys a 300 s session.
- **The exchange is rate-limited per `client_id` AND per caller IP, consuming a point on success too.** Dev sets `AUTHRATELIMIT_ATTEMPTS: 500` / `AUTHRATELIMIT_DURATION: 30`, which is ample; production deployments running many autonomous agents behind one egress IP must size it.
- **A working dev ES256 keypair**, generated and round-trip verified (sign → JWKS verify → 300 s TTL confirmed):
  - private JWK: `{"kty":"EC","x":"iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig","y":"nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M","crv":"P-256","d":"Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q","kid":"dev-1","alg":"ES256"}`
  - the public half is that object minus `d`, plus `use: "sig"`.

---

### Task 1: NHI config, boot validation, and the environment prerequisites

**Files:**
- Create: `api/src/nhi/operations.ts`
- Create: `tests/features/autonomous-agents/nhi.unit.spec.ts`
- Modify: `api/config/type/schema.json` (add `publicUrl`, `nhiSigningKey`)
- Modify: `api/config/default.js`, `api/config/custom-environment-variables.js`, `api/config/development.js`
- Modify: `api/src/config.ts` (boot validation)
- Modify: `api/src/server.ts` (boot notice when the feature is off)
- Modify: `docker-compose.yml` (the two simple-directory env vars)
- Modify: `api/package.json` (+ `jose`, + `@modelcontextprotocol/sdk`), root `package.json` (− `@modelcontextprotocol/sdk` from devDependencies)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface NhiPrivateJwk { kty: string, crv: string, x: string, y: string, d: string, kid: string, alg?: string }`
  - `interface NhiPublicJwk { kty: string, crv: string, x: string, y: string, kid: string, alg: string, use: 'sig' }`
  - `assertNhiConfig(signingKey: unknown, publicUrl: string | undefined): void`
  - `toPublicJwk(privateJwk: NhiPrivateJwk): NhiPublicJwk`
  - `nhiIssuerUrl(publicUrl: string): string`
  - `nhiAudience(publicUrl: string): string`
  - `autonomousAgentSubject(agentId: string): string`

- [ ] **Step 1: Write the failing test**

Create `tests/features/autonomous-agents/nhi.unit.spec.ts`:

```ts
/**
 * stateless unit tests for the NHI issuer's pure helpers
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertNhiConfig, toPublicJwk, nhiIssuerUrl, nhiAudience, autonomousAgentSubject, type NhiPrivateJwk } from '../../../api/src/nhi/operations.ts'

const key: NhiPrivateJwk = {
  kty: 'EC',
  crv: 'P-256',
  x: 'iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig',
  y: 'nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M',
  d: 'Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q',
  kid: 'dev-1',
  alg: 'ES256'
}

test.describe('assertNhiConfig', () => {
  test('accepts the feature being entirely off', () => {
    assertNhiConfig(undefined, undefined)
  })

  test('accepts a valid key with a publicUrl', () => {
    assertNhiConfig(key, 'http://localhost:25475/agents')
  })

  test('rejects a signing key without a publicUrl — the issuer url would not be derivable', () => {
    assert.throws(() => assertNhiConfig(key, undefined), /requires PUBLIC_URL/)
  })

  test('rejects a non-EC key', () => {
    assert.throws(() => assertNhiConfig({ ...key, kty: 'RSA' }, 'http://x/agents'), /must be an EC/)
  })

  test('rejects a curve other than P-256', () => {
    assert.throws(() => assertNhiConfig({ ...key, crv: 'P-384' }, 'http://x/agents'), /P-256/)
  })

  test('rejects a public key — signing needs the private half', () => {
    const { d, ...pub } = key
    assert.throws(() => assertNhiConfig(pub, 'http://x/agents'), /private/)
  })

  test('rejects a key with no kid — rotation depends on it', () => {
    const { kid, ...noKid } = key
    assert.throws(() => assertNhiConfig(noKid, 'http://x/agents'), /kid/)
  })

  test('rejects a non-object signing key', () => {
    assert.throws(() => assertNhiConfig('not-a-jwk', 'http://x/agents'), /must be a JSON object/)
  })

  test('rejects an unparseable publicUrl', () => {
    assert.throws(() => assertNhiConfig(key, 'not a url'), /invalid PUBLIC_URL/)
  })
})

test.describe('toPublicJwk', () => {
  test('strips the private scalar and marks the key for signature use', () => {
    const pub = toPublicJwk(key)
    assert.equal('d' in pub, false)
    assert.equal(JSON.stringify(pub).includes(key.d), false)
    assert.equal(pub.use, 'sig')
    assert.equal(pub.alg, 'ES256')
    assert.equal(pub.kid, 'dev-1')
    assert.equal(pub.x, key.x)
    assert.equal(pub.y, key.y)
  })

  test('defaults alg to ES256 when the private key omits it', () => {
    const { alg, ...noAlg } = key
    assert.equal(toPublicJwk(noAlg as NhiPrivateJwk).alg, 'ES256')
  })
})

test.describe('url and subject helpers', () => {
  test('the issuer is the publicUrl plus /api/nhi, with no double slash', () => {
    assert.equal(nhiIssuerUrl('http://localhost:25475/agents'), 'http://localhost:25475/agents/api/nhi')
    assert.equal(nhiIssuerUrl('http://localhost:25475/agents/'), 'http://localhost:25475/agents/api/nhi')
  })

  test('the audience is the site ORIGIN, not the service path', () => {
    assert.equal(nhiAudience('http://localhost:25475/agents'), 'http://localhost:25475')
    assert.equal(nhiAudience('https://example.org/agents'), 'https://example.org')
  })

  test('the subject namespaces the autonomous agent id', () => {
    assert.equal(autonomousAgentSubject('abc123'), 'autonomous-agent:abc123')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/nhi.unit.spec.ts`
Expected: FAIL — cannot resolve `api/src/nhi/operations.ts`.

- [ ] **Step 3: Write the implementation**

Create `api/src/nhi/operations.ts`:

```ts
/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

/** The ES256 private key this deployment signs NHI assertions with. */
export interface NhiPrivateJwk {
  kty: string
  crv: string
  x: string
  y: string
  d: string
  kid: string
  alg?: string
}

/** The same key's public half, as published in the JWKS. */
export interface NhiPublicJwk {
  kty: string
  crv: string
  x: string
  y: string
  kid: string
  alg: string
  use: 'sig'
}

/**
 * Fail-fast boot validation, mirroring assertGlobalAiConfig/assertGlobalMcpConfig.
 *
 * The whole NHI feature is optional: a deployment with no signing key simply does not
 * serve the issuer routes and refuses to mint assertions. But a signing key WITHOUT a
 * publicUrl is a misconfiguration we must catch at boot, because the issuer url has to
 * be stable and identical to what an org admin registered in simple-directory — and
 * this service otherwise only learns its url per-request, which is unavailable in a
 * background run.
 */
export function assertNhiConfig (signingKey: unknown, publicUrl: string | undefined): void {
  if (signingKey === undefined || signingKey === null) return

  if (typeof signingKey !== 'object' || Array.isArray(signingKey)) {
    throw new Error('invalid NHI config: NHI_SIGNING_KEY must be a JSON object (an ES256 private JWK)')
  }
  const key = signingKey as Partial<NhiPrivateJwk>

  if (!publicUrl) throw new Error('invalid NHI config: NHI_SIGNING_KEY requires PUBLIC_URL to be set, so the issuer url is stable')
  try {
    new URL(publicUrl)
  } catch {
    throw new Error(`invalid NHI config: invalid PUBLIC_URL "${publicUrl}"`)
  }

  if (key.kty !== 'EC') throw new Error('invalid NHI config: NHI_SIGNING_KEY must be an EC key (kty "EC")')
  if (key.crv !== 'P-256') throw new Error('invalid NHI config: NHI_SIGNING_KEY must use curve P-256 (ES256)')
  if (!key.d) throw new Error('invalid NHI config: NHI_SIGNING_KEY must be the private key (missing "d")')
  if (!key.x || !key.y) throw new Error('invalid NHI config: NHI_SIGNING_KEY is missing its public coordinates')
  // Rotation works by publishing a new kid alongside the old one and letting
  // simple-directory's createRemoteJWKSet refetch on an unknown kid. Without a kid
  // there is nothing for it to key on.
  if (!key.kid) throw new Error('invalid NHI config: NHI_SIGNING_KEY must carry a "kid"')
}

/** The JWKS entry. Never returns the private scalar. */
export function toPublicJwk (privateJwk: NhiPrivateJwk): NhiPublicJwk {
  return {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
    kid: privateJwk.kid,
    alg: privateJwk.alg ?? 'ES256',
    use: 'sig'
  }
}

/** Stable issuer url. Must match the `issuer` on the NHI record in simple-directory. */
export function nhiIssuerUrl (publicUrl: string): string {
  return publicUrl.replace(/\/$/, '') + '/api/nhi'
}

/**
 * The `aud` simple-directory checks. It compares against reqSiteUrl(req), which is
 * reqOrigin(req) + reqSitePath(req) — and reqSitePath is empty for the main site, so
 * the audience is the site ORIGIN rather than this service's mount path.
 *
 * A deployment serving agents on a non-main site would need that site's path appended;
 * that is out of scope here.
 */
export function nhiAudience (publicUrl: string): string {
  return new URL(publicUrl).origin
}

/** The `sub` bound on the NHI record. Namespaced so it cannot collide with another subject. */
export function autonomousAgentSubject (agentId: string): string {
  return `autonomous-agent:${agentId}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test-unit -- tests/features/autonomous-agents/nhi.unit.spec.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Add the config schema entries**

In `api/config/type/schema.json`, add to the top-level `properties` (after `autonomousAgentsRequireAdminMode`):

```json
"publicUrl": { "type": "string" },
"nhiSigningKey": {
  "type": "object",
  "required": ["kty", "crv", "x", "y", "d", "kid"],
  "properties": {
    "kty": { "type": "string" },
    "crv": { "type": "string" },
    "x": { "type": "string" },
    "y": { "type": "string" },
    "d": { "type": "string" },
    "kid": { "type": "string" },
    "alg": { "type": "string" }
  }
}
```

Note `nhiSigningKey` is deliberately NOT in the schema's top-level `required` list — the feature is optional.

- [ ] **Step 6: Wire the config files**

`api/config/default.js`, after `autonomousAgentsRequireAdminMode: true,`:

```js
  // Public base url of this service, e.g. https://example.org/agents. Required only
  // when NHI_SIGNING_KEY is set. It is a DECLARATION, not a fetch target: nothing on
  // our side dereferences it. It supplies (a) the NHI issuer identifier, which must be
  // stable and identical to what an org admin registered in simple-directory, and
  // (b) the origin we declare in x-forwarded-* when calling the exchange.
  publicUrl: undefined,
  // ES256 private JWK used to sign NHI assertions. Absent = the autonomous agent NHI
  // feature is off: the issuer routes 404 and no assertion can be minted.
  nhiSigningKey: undefined,
```

`api/config/custom-environment-variables.js`, after the `autonomousAgentsRequireAdminMode` line:

```js
  publicUrl: 'PUBLIC_URL',
  nhiSigningKey: { __name: 'NHI_SIGNING_KEY', __format: 'json' },
```

`api/config/development.js`, after the `mcpServers` block:

```js
  publicUrl: `http://localhost:${process.env.NGINX_PORT}/agents`,
  // Dev-only keypair, generated for this plan and round-trip verified. NEVER reuse a
  // committed key in a real deployment.
  nhiSigningKey: { kty: 'EC', crv: 'P-256', x: 'iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig', y: 'nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M', d: 'Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q', kid: 'dev-1', alg: 'ES256' },
```

- [ ] **Step 7: Call the boot validation and add the notice**

`api/src/config.ts` — add the import and the assertion after `assertGlobalMcpConfig`:

```ts
import { assertNhiConfig } from './nhi/operations.ts'
```
```ts
assertNhiConfig((config as ApiConfig).nhiSigningKey, (config as ApiConfig).publicUrl)
```

`api/src/server.ts` — inside `start()`, beside the other `console.log` notices:

```ts
  if (!config.nhiSigningKey) {
    console.log('[nhi] No NHI_SIGNING_KEY configured: the autonomous agent non-human-identity feature is off. The issuer routes return 404 and no autonomous agent can obtain a session or reach an MCP server. Set NHI_SIGNING_KEY (an ES256 private JWK) and PUBLIC_URL to enable it.')
  }
```

- [ ] **Step 8: Regenerate types and reload the dev server**

Run: `npm run build-types && npm run check-types && npm run lint-fix`
Then: `touch api/index.ts` (so nodemon reloads — it does not watch `api/config/type/.type/`)
Then: `bash dev/status.sh` and confirm `dev-api` is UP. If it is not, read `dev/logs/dev-api.log`, report, and STOP.

- [ ] **Step 9: Move the dependencies**

Run: `npm i -w api jose@^6 @modelcontextprotocol/sdk@^1.30.0`
Then remove `"@modelcontextprotocol/sdk": "^1.30.0",` from the **root** `package.json` `devDependencies`, and run `npm i` to refresh the lockfile.

Verify: `node -e "const p=require('./api/package.json');console.log('jose',p.dependencies.jose,'sdk',p.dependencies['@modelcontextprotocol/sdk'])"`
and `node -e "console.log('root devDep sdk:',require('./package.json').devDependencies['@modelcontextprotocol/sdk'] ?? 'removed')"`

- [ ] **Step 10: Add the simple-directory env vars**

In `docker-compose.yml`, in the `simple-directory` service's `environment:` block, after `MANAGE_SITES: true`:

```yaml
      MANAGE_NHIS: true
      # dev only: the issuer is http://localhost, which assertSafeIssuer would reject
      # for being non-https on a private host
      NHIS_ALLOW_INSECURE_ISSUERS: true
```

**Do NOT restart the container yourself.** Report in your task report that the user must restart `simple-directory` for these to take effect, and that Task 3 cannot pass until they have.

- [ ] **Step 11: Run the suites and commit**

Run: `npm run test-unit && npm run test-api`
Expected: PASS (the api suite is unaffected by this task).

```bash
git add api/src/nhi/operations.ts tests/features/autonomous-agents/nhi.unit.spec.ts api/config api/src/config.ts api/src/server.ts api/package.json package.json package-lock.json docker-compose.yml
git commit -m "feat(autonomous-agents): nhi signing key config and boot validation"
```

---

### Task 2: The issuer endpoints — discovery and JWKS

**Files:**
- Create: `api/src/nhi/service.ts`
- Create: `api/src/nhi/router.ts`
- Create: `tests/features/autonomous-agents/nhi-issuer.api.spec.ts`
- Modify: `api/src/app.ts` (mount the router)

**Interfaces:**
- Consumes: `assertNhiConfig`, `toPublicJwk`, `nhiIssuerUrl`, `nhiAudience`, `autonomousAgentSubject` (Task 1).
- Produces:
  - `nhiEnabled(): boolean`
  - `getNhiIssuer(): string` — throws 501 when disabled
  - `getNhiDiscovery(): { issuer: string, jwks_uri: string }`
  - `getNhiJwks(): { keys: NhiPublicJwk[] }`
  - Routes `GET /api/nhi/.well-known/openid-configuration`, `GET /api/nhi/jwks`

**Why these routes are public:** simple-directory fetches them server-to-server with no session. They expose only a public key and two urls.

- [ ] **Step 1: Write the failing test**

Create `tests/features/autonomous-agents/nhi-issuer.api.spec.ts`:

```ts
/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { anonymousAx } from '../../support/axios.ts'

const publicUrl = `http://localhost:${process.env.NGINX_PORT}/agents`
const expectedIssuer = `${publicUrl}/api/nhi`

test.describe('NHI issuer endpoints', () => {
  test('the discovery document is public and self-consistent', async () => {
    const res = await anonymousAx.get('/api/nhi/.well-known/openid-configuration')
    assert.equal(res.status, 200)
    // simple-directory's getJwksUri rejects a discovery document whose `issuer` does
    // not match the url it was fetched for, so this equality is load-bearing.
    assert.equal(res.data.issuer, expectedIssuer)
    assert.equal(res.data.jwks_uri, `${expectedIssuer}/jwks`)
  })

  test('the JWKS is public, carries a kid, and never exposes the private scalar', async () => {
    const res = await anonymousAx.get('/api/nhi/jwks')
    assert.equal(res.status, 200)
    assert.equal(Array.isArray(res.data.keys), true)
    assert.equal(res.data.keys.length >= 1, true)
    const [key] = res.data.keys
    assert.equal(key.kty, 'EC')
    assert.equal(key.crv, 'P-256')
    assert.equal(key.use, 'sig')
    assert.ok(key.kid, 'expected a kid so rotation can key on it')
    assert.equal('d' in key, false)
    // the dev private scalar must not appear anywhere in the response
    assert.equal(JSON.stringify(res.data).includes('Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q'), false)
  })

  test('the published key actually verifies an assertion this service signs', async () => {
    const { importJWK, SignJWT, jwtVerify, createLocalJWKSet } = await import('jose')
    const jwks = (await anonymousAx.get('/api/nhi/jwks')).data

    // sign with the dev private key from api/config/development.js
    const priv = { kty: 'EC', crv: 'P-256', x: 'iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig', y: 'nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M', d: 'Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q', kid: 'dev-1', alg: 'ES256' }
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'dev-1' })
      .setIssuer(expectedIssuer)
      .setSubject('autonomous-agent:probe')
      .setAudience(`http://localhost:${process.env.NGINX_PORT}`)
      .setIssuedAt()
      .setExpirationTime('300s')
      .sign(await importJWK(priv, 'ES256'))

    // verifying against the PUBLISHED jwks proves the endpoint serves the matching half
    const { payload } = await jwtVerify(jwt, createLocalJWKSet(jwks), {
      issuer: expectedIssuer,
      audience: `http://localhost:${process.env.NGINX_PORT}`,
      subject: 'autonomous-agent:probe'
    })
    assert.equal(payload.sub, 'autonomous-agent:probe')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-api -- tests/features/autonomous-agents/nhi-issuer.api.spec.ts`
Expected: FAIL with 404s — the routes do not exist.

- [ ] **Step 3: Write the service**

Create `api/src/nhi/service.ts`:

```ts
/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 */

import config from '#config'
import { httpError } from '@data-fair/lib-express'
import { toPublicJwk, nhiIssuerUrl, nhiAudience, type NhiPrivateJwk, type NhiPublicJwk } from './operations.ts'

/** The whole NHI feature is off when no signing key is configured. */
export const nhiEnabled = () => !!config.nhiSigningKey

const requireNhi = (): { key: NhiPrivateJwk, publicUrl: string } => {
  // 501 rather than 404: the caller asked for a coherent capability this deployment
  // has not enabled, and boot validation already guarantees publicUrl is set whenever
  // the key is.
  if (!config.nhiSigningKey || !config.publicUrl) throw httpError(501, 'the autonomous agent non-human-identity feature is not configured on this deployment')
  return { key: config.nhiSigningKey as NhiPrivateJwk, publicUrl: config.publicUrl }
}

export const getNhiIssuer = (): string => nhiIssuerUrl(requireNhi().publicUrl)

export const getNhiAudience = (): string => nhiAudience(requireNhi().publicUrl)

export const getNhiSigningKey = (): NhiPrivateJwk => requireNhi().key

export const getNhiDiscovery = (): { issuer: string, jwks_uri: string } => {
  const issuer = getNhiIssuer()
  return { issuer, jwks_uri: `${issuer}/jwks` }
}

export const getNhiJwks = (): { keys: NhiPublicJwk[] } => ({ keys: [toPublicJwk(requireNhi().key)] })
```

- [ ] **Step 4: Write the router**

Create `api/src/nhi/router.ts`:

```ts
/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { httpError } from '@data-fair/lib-express'
import { nhiEnabled, getNhiDiscovery, getNhiJwks } from './service.ts'

const router = Router()
export default router

// Both routes are deliberately PUBLIC and unauthenticated: simple-directory fetches
// them server-to-server with no session, and they expose only a public key and two
// urls. When the feature is off they 404, matching simple-directory's own behaviour
// for a deployment with manageNhis disabled.
router.get('/.well-known/openid-configuration', (req, res, next) => {
  try {
    if (!nhiEnabled()) throw httpError(404, 'not found')
    res.json(getNhiDiscovery())
  } catch (err) { next(err) }
})

router.get('/jwks', (req, res, next) => {
  try {
    if (!nhiEnabled()) throw httpError(404, 'not found')
    res.json(getNhiJwks())
  } catch (err) { next(err) }
})
```

- [ ] **Step 5: Mount the router**

In `api/src/app.ts`, add the import beside the others:

```ts
import nhiRouter from './nhi/router.ts'
```

and the mount, **before** the `app.use('/api', ...)` 404 catch-all:

```ts
app.use('/api/nhi', nhiRouter)
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test-api -- tests/features/autonomous-agents/nhi-issuer.api.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Verify the discovery document is reachable the way simple-directory will fetch it**

simple-directory runs with `network_mode: host` and will fetch the issuer url as given. Confirm it resolves from outside the Node process:

Run: `curl -sS "http://localhost:${NGINX_PORT}/agents/api/nhi/.well-known/openid-configuration"` (take `NGINX_PORT` from `.env`)
Expected: the JSON document, with `issuer` exactly matching the url you fetched minus `/.well-known/openid-configuration`. If nginx does not proxy it, report and STOP — Task 3 depends on this path being reachable.

- [ ] **Step 8: Commit**

```bash
git add api/src/nhi/service.ts api/src/nhi/router.ts api/src/app.ts tests/features/autonomous-agents/nhi-issuer.api.spec.ts
git commit -m "feat(autonomous-agents): serve the nhi issuer discovery document and jwks"
```

---

### Task 3: Revise the issuer to be request-derived, and capture the site url

**Supersedes parts of Tasks 1-2, which are already committed.** Those tasks derived the
issuer from a `PUBLIC_URL` config value. That is being removed in favour of *capturing*
the real site url from the proxied request that enrols an autonomous agent. Three reasons,
in increasing order of force:

1. No new config at all, and no operator guess: the admin was demonstrably browsing this
   service at that origin, so it provably resolves here.
2. The audience we sign, the `x-forwarded-*` we declare and the exchange path all derive
   from **one** stored value, so they cannot drift apart.
3. It is the only way to get `sitePath` right, and `sitePath` is mandatory —
   `createSiteMiddleware` derives it from `(.*?)\/<service>(\/|$)`, and simple-directory
   calls it with no options, so the exchange url must carry both that prefix and a
   `/simple-directory` segment or the middleware 404s before the route runs.

Serving discovery from the request is also strictly more correct: simple-directory rejects
a discovery document whose `issuer` differs from the url it fetched, and an echo of
`reqSiteUrl(req)` matches by construction where a config value could drift.

**Files:**
- Modify: `api/src/nhi/operations.ts` (drop the publicUrl arg; re-key the url helpers on a site url; add the exchange helpers)
- Modify: `api/src/nhi/service.ts`, `api/src/nhi/router.ts` (discovery from the request)
- Modify: `api/config/type/schema.json`, `default.js`, `custom-environment-variables.js`, `development.js` (remove `publicUrl`)
- Modify: `api/src/config.ts`, `api/src/server.ts`
- Modify: `api/types/autonomous-agent/schema.js` (`nhi` gains read-only `siteUrl` and `issuer`)
- Modify: `tests/features/autonomous-agents/nhi.unit.spec.ts`

**Interfaces:**
- Produces:
  - `assertNhiConfig(signingKey: unknown): void` — one argument now
  - `SERVICE_PATH_PART = 'agents'`
  - `nhiIssuerUrl(siteUrl: string): string`
  - `nhiExchangeUrl(privateDirectoryUrl: string, siteUrl: string): string`
  - `exchangeHeaders(siteUrl: string): Record<string, string>`
  - `DECLARED_CLIENT_IP = '127.0.0.1'`
  - `getNhiDiscovery(req)` — takes the request
  - **Removed:** `nhiAudience`. The audience is the stored site url itself, so a function that returned `new URL(x).origin` would now be actively wrong for a path-based site.

- [ ] **Step 1: Write the failing tests**

Replace the `assertNhiConfig` publicUrl cases and the url-helper describes in
`tests/features/autonomous-agents/nhi.unit.spec.ts`. Delete these two tests, which no
longer describe the contract:

```ts
  test('rejects a signing key without a publicUrl — the issuer url would not be derivable', () => { … })
  test('rejects an unparseable publicUrl', () => { … })
```

Change every surviving `assertNhiConfig(key, '…')` call to `assertNhiConfig(key)`, and
replace the whole `test.describe('url and subject helpers', …)` block with:

```ts
test.describe('nhiIssuerUrl', () => {
  test('mounts the issuer under the service path of the captured site url', () => {
    assert.equal(nhiIssuerUrl('http://localhost:25475'), 'http://localhost:25475/agents/api/nhi')
  })

  test('preserves a path-based site prefix', () => {
    assert.equal(nhiIssuerUrl('https://example.org/portal'), 'https://example.org/portal/agents/api/nhi')
  })

  test('tolerates a trailing slash without doubling it', () => {
    assert.equal(nhiIssuerUrl('https://example.org/portal/'), 'https://example.org/portal/agents/api/nhi')
  })
})

test.describe('nhiExchangeUrl', () => {
  // Both segments are mandatory: simple-directory calls createSiteMiddleware('simple-directory')
  // with no options, so a url without a /simple-directory segment throws 404 before the
  // route runs, and a missing sitePath prefix resolves a different site.
  test('inserts the /simple-directory segment on the main site', () => {
    assert.equal(
      nhiExchangeUrl('http://simple-directory:8080', 'http://localhost:25475'),
      'http://simple-directory:8080/simple-directory/api/auth/nhi-token'
    )
  })

  test('preserves the site path prefix ahead of the service segment', () => {
    assert.equal(
      nhiExchangeUrl('http://simple-directory:8080', 'https://example.org/portal'),
      'http://simple-directory:8080/portal/simple-directory/api/auth/nhi-token'
    )
  })

  test('does not leave a double slash for a root site url', () => {
    assert.equal(nhiExchangeUrl('http://simple-directory:8080/', 'https://example.org/'), 'http://simple-directory:8080/simple-directory/api/auth/nhi-token')
  })
})

test.describe('exchangeHeaders', () => {
  test('declares the three headers the route requires', () => {
    const h = exchangeHeaders('http://localhost:25475')
    assert.equal(h['x-forwarded-host'], 'localhost:25475')
    assert.equal(h['x-forwarded-proto'], 'http')
    assert.equal(h['x-forwarded-for'], '127.0.0.1')
    assert.equal(h['content-type'], 'application/json')
  })

  test('drops a default https port from the declared host', () => {
    const h = exchangeHeaders('https://example.org')
    assert.equal(h['x-forwarded-host'], 'example.org')
    assert.equal(h['x-forwarded-proto'], 'https')
  })

  // THE invariant of this whole exchange: simple-directory rebuilds the audience as
  // reqOrigin(from our declared headers) + reqSitePath(from the url path we posted to),
  // and compares it to the `aud` we signed — which is the stored site url. If these ever
  // disagree, every exchange fails as an indistinguishable 401 with no diagnostic.
  for (const siteUrl of ['http://localhost:25475', 'https://example.org', 'https://example.org/portal', 'http://example.org:8080/portal']) {
    test(`declared headers + posted path reconstruct exactly the signed audience — ${siteUrl}`, () => {
      const h = exchangeHeaders(siteUrl)
      const [host, port] = h['x-forwarded-host'].split(':')
      const proto = h['x-forwarded-proto']
      const origin = port && !(port === '443' && proto === 'https') && !(port === '80' && proto === 'http')
        ? `${proto}://${host}:${port}`
        : `${proto}://${host}`
      // simple-directory's sitePath is match[1] of (.*?)\/simple-directory(\/|$) against
      // the path we posted to — i.e. exactly the prefix nhiExchangeUrl preserved
      const posted = new URL(nhiExchangeUrl('http://sd:8080', siteUrl)).pathname
      const sitePath = posted.slice(0, posted.indexOf('/simple-directory'))
      assert.equal(origin + sitePath, siteUrl.replace(/\/$/, ''))
    })
  }
})
```

Add `nhiExchangeUrl, exchangeHeaders` to the import and drop `nhiAudience` from it.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/nhi.unit.spec.ts`
Expected: FAIL — `assertNhiConfig` still takes two arguments and the new helpers do not exist.

- [ ] **Step 3: Revise the pure helpers**

In `api/src/nhi/operations.ts`: change `assertNhiConfig` to take only `signingKey` and drop
its two `publicUrl` checks (keep every key-shape check and its message verbatim). Then
replace `nhiIssuerUrl`/`nhiAudience` with:

```ts
/**
 * This service's public mount segment. Must match createSiteMiddleware('agents') in
 * app.ts — the issuer path and the exchange path are both built from it.
 */
export const SERVICE_PATH_PART = 'agents'

/**
 * The issuer identifier for a captured site url. `siteUrl` is reqOrigin + reqSitePath
 * taken from a real proxied request, so this is a url that demonstrably resolves here.
 */
export function nhiIssuerUrl (siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}/${SERVICE_PATH_PART}/api/nhi`
}

/**
 * Where to POST the exchange. Two constraints, both because simple-directory calls
 * createSiteMiddleware('simple-directory') with NO options:
 *  - the path must contain a `/simple-directory` segment, or the middleware throws
 *    404 'URL path does not contain service prefix' before the route runs;
 *  - the site path prefix must be preserved ahead of it, or simple-directory resolves a
 *    different site (and therefore a different audience).
 * We target the PRIVATE directory url so the call never leaves the internal network.
 */
export function nhiExchangeUrl (privateDirectoryUrl: string, siteUrl: string): string {
  const sitePath = new URL(siteUrl).pathname.replace(/\/+$/, '')
  return `${privateDirectoryUrl.replace(/\/+$/, '')}${sitePath}/simple-directory/api/auth/nhi-token`
}

/**
 * Declared, not real. Its only readers are simple-directory's per-IP rate-limit bucket
 * and its audit log line; every autonomous agent shares one egress address anyway. This
 * is also why allowedIps/ipBinding must never be set on an autonomous agent's NHI.
 */
export const DECLARED_CLIENT_IP = '127.0.0.1'

/**
 * The exchange is server-to-server, so no reverse proxy sets x-forwarded-* and the route
 * needs all three: x-forwarded-for (read before any lookup, so a broken proxy chain
 * rejects every caller identically), x-forwarded-host (resolves the site and, through
 * reqSiteUrl, IS the audience) and x-forwarded-proto (reqOrigin throws without it).
 */
export function exchangeHeaders (siteUrl: string): Record<string, string> {
  const url = new URL(siteUrl)
  return {
    'content-type': 'application/json',
    'x-forwarded-for': DECLARED_CLIENT_IP,
    'x-forwarded-host': url.host,
    'x-forwarded-proto': url.protocol.replace(':', '')
  }
}
```

- [ ] **Step 4: Serve discovery from the request**

In `api/src/nhi/service.ts`: drop `publicUrl` from `requireNhi` (it now returns just the
key), delete `getNhiIssuer`/`getNhiAudience`, and make discovery request-derived:

```ts
import { reqSiteUrl } from '@data-fair/lib-express'
import type { Request } from 'express'

/**
 * Built from the request rather than config, so the `issuer` we echo is always exactly
 * the url simple-directory fetched — it rejects a discovery document that claims a
 * different issuer, and a config value could drift from reality.
 */
export const getNhiDiscovery = (req: Request): { issuer: string, jwks_uri: string } => {
  requireNhi()
  const issuer = nhiIssuerUrl(reqSiteUrl(req))
  return { issuer, jwks_uri: `${issuer}/jwks` }
}
```

In `api/src/nhi/router.ts`, pass the request: `res.json(getNhiDiscovery(req))`.

`reqSiteUrl` throws for an internal request (no `x-forwarded-host`). That is correct
behaviour here — simple-directory fetches through the public url — and surfaces as a 500
rather than a wrong issuer, which is the safer failure.

- [ ] **Step 5: Remove `publicUrl` from config**

Delete the `publicUrl` entry from `api/config/type/schema.json` `properties`, from
`api/config/default.js`, from `api/config/custom-environment-variables.js` and from
`api/config/development.js`. In `api/src/config.ts` call `assertNhiConfig(config.nhiSigningKey)`.
In `api/src/server.ts`, drop ` and PUBLIC_URL` from the `[nhi]` boot notice.

Then, in this order (the trap that crashed dev-api in Task 1): `npm run build-types`,
then `touch api/index.ts`, then `bash dev/status.sh` and confirm dev-api is UP.

- [ ] **Step 6: Store the captured values on the autonomous agent**

In `api/types/autonomous-agent/schema.js`, extend the `nhi` object so the captured values
have somewhere to live. `clientId` stays client-writable; the other two are server-owned:

```js
    nhi: {
      type: 'object',
      additionalProperties: false,
      required: ['clientId'],
      title: 'Non-human identity',
      'x-i18n-title': { en: 'Non-human identity', fr: 'Identité non humaine' },
      properties: {
        clientId: {
          type: 'string',
          title: 'Client id',
          'x-i18n-title': { en: 'Client id', fr: 'Identifiant client' }
        },
        // Captured server-side from the proxied request that enrolled this autonomous
        // agent (reqSiteUrl), never sent by the client. Everything the exchange needs is
        // derived from these two, so they cannot drift from each other.
        siteUrl: { type: 'string', readOnly: true },
        issuer: { type: 'string', readOnly: true }
      }
    },
```

Leave `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js` alone: it picks
`nhi` from this schema, so `readOnly` keeps the two new fields out of the generated form.

**`readOnly` does NOT stop a client sending them.** Verified in this tree: ajv treats
`readOnly` as a documentation hint (nothing in `@data-fair/lib-validation` or `api/src`
enforces it), the generated write-req validator now accepts `nhi.siteUrl` and
`nhi.issuer` as *known* string keys, and `additionalProperties: false` only rejects
*unknown* ones. The routers spread the validated `body` straight into mongo, so as of
this task a client could persist arbitrary values in both fields.

That is inert here — nothing reads them until Task 4 — and Task 4 closes it by
overwriting both server-side on every write, with a regression test proving a
client-supplied value is discarded. Do not add a defensive strip in this task; it would
be code Task 4 deletes.

Run `npm run build-types`, then `touch api/index.ts`, then confirm dev-api is UP.

- [ ] **Step 7: Verify nothing regressed**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`
Expected: PASS. The existing `nhi-issuer.api.spec.ts` must still pass **unchanged** — in
dev, `reqSiteUrl(req)` is `http://localhost:<NGINX_PORT>` and `sitePath` is empty, so the
issuer is byte-identical to what the config-derived version produced. If that spec fails,
stop and report: it means the request-derived issuer does not agree with the previous
value, which would invalidate the premise of this task.

- [ ] **Step 8: Commit**

```bash
git add api/src/nhi api/config api/src/config.ts api/src/server.ts api/types/autonomous-agent tests/features/autonomous-agents/nhi.unit.spec.ts
git commit -m "refactor(autonomous-agents): derive the nhi issuer from the request, not config"
```

---

### Task 4: Mint an assertion and exchange it for a session

**Files:**
- Modify: `api/src/nhi/operations.ts` (add `buildAssertionClaims`, `sessionExpiryFromExchange`, `shouldRefreshSession`)
- Modify: `api/src/nhi/service.ts` (add `mintAssertion`, `exchangeForSession`, `getAutonomousAgentSession`, `clearAutonomousAgentSession`)
- Modify: `tests/features/autonomous-agents/nhi.unit.spec.ts` (add cases)
- Create: `tests/features/autonomous-agents/nhi-exchange.api.spec.ts`

**Interfaces:**
- Consumes: everything from Tasks 1-3.
- Produces:
  - `buildAssertionClaims(opts: { issuer: string, subject: string, audience: string, ttlSeconds: number, nowSeconds: number }): { iss: string, sub: string, aud: string, iat: number, exp: number, jti: string }`
  - `shouldRefreshSession(expiresAtMs: number, nowMs: number, ttlMs: number): boolean`
  - `interface EnrolledAutonomousAgent { id: string, nhi?: { clientId: string, siteUrl?: string, issuer?: string } }`
  - `mintAssertion(autonomousAgent: EnrolledAutonomousAgent): Promise<string>`
  - `exchangeForSession(autonomousAgent: EnrolledAutonomousAgent): Promise<{ cookieHeader: string, expiresAtMs: number }>`
  - `getAutonomousAgentSession(autonomousAgent: EnrolledAutonomousAgent): Promise<string>` — returns the `Cookie` header value, cached and refreshed
  - the write routes capture `nhi.siteUrl` / `nhi.issuer` from `reqSiteUrl(req)`
  - `clearAutonomousAgentSession(agentId: string): void`

**PREREQUISITE:** the user must have restarted `simple-directory` with `MANAGE_NHIS: true` and `NHIS_ALLOW_INSECURE_ISSUERS: true` (Task 1 step 10). Without it every exchange returns 404 and this task's api test cannot pass. Verify with the probe in step 5 before implementing, and if it 404s, report and STOP.

- [ ] **Step 1: Write the failing unit tests**

Append to `tests/features/autonomous-agents/nhi.unit.spec.ts`:

```ts
test.describe('buildAssertionClaims', () => {
  const base = { issuer: 'http://x/agents/api/nhi', subject: 'autonomous-agent:a1', audience: 'http://x', ttlSeconds: 300, nowSeconds: 1_700_000_000 }

  test('sets every claim simple-directory requires', () => {
    const claims = buildAssertionClaims(base)
    assert.equal(claims.iss, base.issuer)
    assert.equal(claims.sub, base.subject)
    assert.equal(claims.aud, base.audience)
    // verifyAssertion passes requiredClaims: ['exp', 'sub', 'iat']
    assert.equal(claims.iat, base.nowSeconds)
    assert.equal(claims.exp, base.nowSeconds + 300)
  })

  test('the session length is capped by this ttl, so it must be honoured exactly', () => {
    assert.equal(buildAssertionClaims({ ...base, ttlSeconds: 120 }).exp - base.nowSeconds, 120)
  })

  test('each assertion carries a distinct jti', () => {
    assert.notEqual(buildAssertionClaims(base).jti, buildAssertionClaims(base).jti)
  })
})

test.describe('shouldRefreshSession', () => {
  const ttl = 300_000

  test('does not refresh a fresh session', () => {
    assert.equal(shouldRefreshSession(1_000_000 + ttl, 1_000_000, ttl), false)
  })

  test('refreshes once past 80% of the lifetime', () => {
    // 80% of 300s = 240s in; expiry is at now + 60s
    assert.equal(shouldRefreshSession(1_000_000 + 60_000, 1_000_000, ttl), true)
  })

  test('refreshes an already expired session', () => {
    assert.equal(shouldRefreshSession(1_000_000 - 1, 1_000_000, ttl), true)
  })
})
```

Add `buildAssertionClaims, shouldRefreshSession` to the existing import from `api/src/nhi/operations.ts` at the top of that file.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/nhi.unit.spec.ts`
Expected: FAIL — the two functions are not exported.

- [ ] **Step 3: Implement the pure helpers**

Append to `api/src/nhi/operations.ts`:

```ts
/**
 * The assertion's claims. Signature, iss, sub, aud and exp/nbf are all checked by
 * simple-directory in one jwtVerify call, with requiredClaims ['exp', 'sub', 'iat'].
 *
 * ttlSeconds is load-bearing beyond replay risk: the issued session lives
 * min(assertion.exp, now + 30m), so a short ttl shortens the session too.
 */
export function buildAssertionClaims (opts: {
  issuer: string
  subject: string
  audience: string
  ttlSeconds: number
  nowSeconds: number
}): { iss: string, sub: string, aud: string, iat: number, exp: number, jti: string } {
  return {
    iss: opts.issuer,
    sub: opts.subject,
    aud: opts.audience,
    iat: opts.nowSeconds,
    exp: opts.nowSeconds + opts.ttlSeconds,
    jti: crypto.randomUUID()
  }
}

/**
 * Refresh at 80% of the session's lifetime rather than on expiry, so a call never
 * races the cutoff. Also true for an already-expired session.
 */
export function shouldRefreshSession (expiresAtMs: number, nowMs: number, ttlMs: number): boolean {
  return nowMs >= expiresAtMs - ttlMs * 0.2
}

```

- [ ] **Step 4: Run to verify the unit tests pass**

Run: `npm run test-unit -- tests/features/autonomous-agents/nhi.unit.spec.ts`
Expected: PASS (20 tests).

- [ ] **Step 5: Probe that the exchange endpoint exists before writing the client**

Take `NGINX_PORT` from `.env`, then:

Run: `curl -sS -o /dev/null -w '%{http_code}\n' -X POST "http://localhost:${NGINX_PORT}/simple-directory/api/auth/nhi-token" -H 'content-type: application/json' -d '{"client_id":"nhi-does-not-exist","assertion":"x"}'`

Expected: **401** — the endpoint exists and is refusing bad credentials (it returns a uniform 401 for every failure).
If you get **404**, `manageNhis` is still off: the user has not restarted `simple-directory` with the Task 1 env vars. Report that and STOP.

- [ ] **Step 6: Implement minting, exchange and the session cache**

Append to `api/src/nhi/service.ts`:

```ts
import { SignJWT, importJWK } from 'jose'
import axios from '@data-fair/lib-node/axios.js'
import { buildAssertionClaims, shouldRefreshSession, autonomousAgentSubject, exchangeHeaders, nhiExchangeUrl } from './operations.ts'

/**
 * Assertion lifetime, and therefore session lifetime (see buildAssertionClaims).
 * nhi-proxy uses 120s because a browser it drives holds the cookie directly; here the
 * cookie never leaves this process, so 300s cuts exchanges ~15x against the 30m cap
 * at a cost bounded by the assertion never being exposed.
 */
export const ASSERTION_TTL_SECONDS = 300

/** The shape the exchange needs off an autonomous agent document. */
export interface EnrolledAutonomousAgent {
  id: string
  nhi?: { clientId: string, siteUrl?: string, issuer?: string }
}

/**
 * An autonomous agent can only be exchanged for a session once all three captured values
 * are present. siteUrl/issuer are written by the write routes from reqSiteUrl(req); an
 * agent enrolled before that capture existed would have clientId alone, so check all three
 * rather than assuming.
 */
const requireEnrolment = (autonomousAgent: EnrolledAutonomousAgent) => {
  const nhi = autonomousAgent.nhi
  if (!nhi?.clientId || !nhi.siteUrl || !nhi.issuer) {
    throw httpError(400, `autonomous agent ${autonomousAgent.id} has no enrolled non-human identity`)
  }
  return { clientId: nhi.clientId, siteUrl: nhi.siteUrl, issuer: nhi.issuer }
}

export const mintAssertion = async (autonomousAgent: EnrolledAutonomousAgent): Promise<string> => {
  const key = getNhiSigningKey()
  const { siteUrl, issuer } = requireEnrolment(autonomousAgent)
  const claims = buildAssertionClaims({
    issuer,
    subject: autonomousAgentSubject(autonomousAgent.id),
    // The audience is the stored site url, which is exactly reqOrigin + reqSitePath as
    // simple-directory recomputes it from the headers and path we send below.
    audience: siteUrl,
    ttlSeconds: ASSERTION_TTL_SECONDS,
    nowSeconds: Math.floor(Date.now() / 1000)
  })
  return await new SignJWT({ jti: claims.jti })
    .setProtectedHeader({ alg: 'ES256', kid: key.kid })
    .setIssuer(claims.iss)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setIssuedAt(claims.iat)
    .setExpirationTime(claims.exp)
    .sign(await importJWK(key, 'ES256'))
}

/**
 * Exchange the assertion for a session, over the PRIVATE directory url so the call never
 * leaves the internal network. We keep the Set-Cookie pairs rather than the returned
 * access_token because @data-fair/lib-express reads sessions from the id_token /
 * id_token_sign COOKIES only and parses no Authorization header — the same reason
 * nhi-proxy relays Set-Cookie to its client.
 */
export const exchangeForSession = async (autonomousAgent: EnrolledAutonomousAgent): Promise<{ cookieHeader: string, expiresAtMs: number }> => {
  const { clientId, siteUrl } = requireEnrolment(autonomousAgent)
  const assertion = await mintAssertion(autonomousAgent)
  const res = await axios.post(
    nhiExchangeUrl(config.privateDirectoryUrl, siteUrl),
    { client_id: clientId, assertion },
    { headers: exchangeHeaders(siteUrl), maxRedirects: 0 }
  )
  const setCookies: string[] = res.headers['set-cookie'] ?? []
  // keep only name=value, dropping attributes (Path, HttpOnly, …) — a Cookie request
  // header carries pairs only
  const pairs = setCookies.map(c => c.split(';')[0].trim()).filter(Boolean)
  if (!pairs.some(pair => pair.startsWith('id_token='))) {
    throw new Error('nhi exchange returned no id_token cookie')
  }
  const expiresIn = typeof res.data?.expires_in === 'number' ? res.data.expires_in : ASSERTION_TTL_SECONDS
  return { cookieHeader: pairs.join('; '), expiresAtMs: Date.now() + expiresIn * 1000 }
}

/**
 * Per-autonomous-agent session cache. In-process and deliberately simple: sessions are
 * short-lived and non-refreshable by construction, so a lost cache costs one exchange.
 */
const sessions = new Map<string, { cookieHeader: string, expiresAtMs: number }>()

export const clearAutonomousAgentSession = (agentId: string) => { sessions.delete(agentId) }

export const getAutonomousAgentSession = async (autonomousAgent: EnrolledAutonomousAgent): Promise<string> => {
  requireEnrolment(autonomousAgent)
  const cached = sessions.get(autonomousAgent.id)
  if (cached && !shouldRefreshSession(cached.expiresAtMs, Date.now(), ASSERTION_TTL_SECONDS * 1000)) {
    return cached.cookieHeader
  }
  const session = await exchangeForSession(autonomousAgent)
  sessions.set(autonomousAgent.id, session)
  return session.cookieHeader
}
```

- [ ] **Step 7: Write the exchange api test**

Create `tests/features/autonomous-agents/nhi-exchange.api.spec.ts`. It performs a **real** enrolment and a **real** exchange against the dev simple-directory:

```ts
/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 *
 * This spec exercises the real simple-directory NHI exchange. It requires the dev
 * simple-directory to run with MANAGE_NHIS=true and NHIS_ALLOW_INSECURE_ISSUERS=true.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const publicUrl = `http://localhost:${process.env.NGINX_PORT}/agents`
const issuer = `${publicUrl}/api/nhi`

test.describe('NHI exchange', () => {
  test.beforeEach(async () => { await clean() })

  test('an enrolled autonomous agent obtains a real simple-directory session', async () => {
    // 1. create the autonomous agent
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Identity probe',
      persona: 'You probe identity.',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true
    })
    const agentId = created.data.id

    // 2. an org admin registers the NHI in simple-directory, bound to this service's
    //    issuer and the agent's namespaced subject. Discovery is used rather than an
    //    inline jwks, so rotation needs no re-enrolment.
    const nhi = await orgAdmin.post(`${directoryUrl}/api/organizations/test1/nhis`, {
      name: `autonomous-agent-${agentId}`,
      provider: { issuer },
      subject: `autonomous-agent:${agentId}`
    })
    assert.equal(nhi.status, 200)
    const clientId = nhi.data.id
    assert.match(clientId, /^nhi-/)

    // 3. store the client id on the autonomous agent
    const updated = await admin.put(`/api/autonomous-agents/organization/test1/${agentId}`, {
      title: 'Identity probe',
      persona: 'You probe identity.',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true,
      nhi: { clientId }
    })
    assert.equal(updated.data.nhi.clientId, clientId)

    // 4. the service exchanges an assertion for a session, and reports the identity it
    //    obtained. This is the first end-to-end proof that the issuer, the JWKS, the
    //    assertion claims and the audience all line up.
    const session = await admin.get(`/api/autonomous-agents/organization/test1/${agentId}/session`)
    assert.equal(session.status, 200)
    assert.equal(session.data.userId, clientId)
    assert.equal(session.data.organization, 'test1')
    assert.equal(session.data.nhi, true)
    assert.ok(session.data.expiresIn > 0 && session.data.expiresIn <= 300, 'session capped by the assertion ttl')
    // the cookie itself must never be returned
    assert.equal(JSON.stringify(session.data).includes('id_token'), false)
  })

  test('a client-supplied nhi.siteUrl / nhi.issuer is discarded, not trusted', async () => {
    // readOnly is only a form hint: ajv does not enforce it, and these are KNOWN keys so
    // additionalProperties: false does not reject them either. The write routes must
    // therefore overwrite both from reqSiteUrl(req) on every write. Without this test the
    // only thing standing between an admin and an attacker-chosen issuer is a comment.
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Injection probe',
      persona: 'x',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true,
      nhi: { clientId: 'nhi-whatever', siteUrl: 'https://attacker.example', issuer: 'https://attacker.example/agents/api/nhi' }
    }).catch((err: any) => err)

    // The POST may legitimately fail enrolment verification (Task 5) for the bogus
    // clientId; what must NOT happen is the attacker values being persisted. Read back
    // whichever agent exists and assert the captured values won.
    const list = await admin.get('/api/autonomous-agents/organization/test1')
    const stored = list.data.results.find((a: any) => a.title === 'Injection probe')
    if (stored) {
      assert.equal(stored.nhi?.siteUrl, `http://localhost:${process.env.NGINX_PORT}`)
      assert.match(stored.nhi?.issuer ?? '', /\/agents\/api\/nhi$/)
      assert.equal(JSON.stringify(stored).includes('attacker.example'), false)
    }
  })

  test('an autonomous agent with no enrolled identity is refused', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'No identity',
      persona: 'x',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true
    })
    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/session`),
      (err: any) => { assert.equal(err.status, 400); assert.match(JSON.stringify(err.data), /non-human identity/); return true }
    )
  })
})
```

- [ ] **Step 8: Capture the site url on save, and add the `/session` diagnostic route**

First the capture. In `api/src/autonomous-agents/router.ts`, in BOTH the POST and the PUT
handler, derive the two server-owned values from the request whenever a `clientId` is
present, and never from the body:

```ts
// Captured, not configured: this request came through the proxy from an admin who was
// browsing this service, so reqSiteUrl(req) is a site url that demonstrably resolves
// here. Everything the exchange needs — the signed audience, the declared
// x-forwarded-*, and the path it posts to — derives from this one value, so they cannot
// drift apart. See api/src/nhi/operations.ts.
const nhi = body.nhi?.clientId
  ? { clientId: body.nhi.clientId, siteUrl: reqSiteUrl(req).replace(/\/+$/, ''), issuer: nhiIssuerUrl(reqSiteUrl(req)) }
  : undefined
```

and use that `nhi` in place of `body.nhi` when assembling the document (`{ ...body, ...(nhi ? { nhi } : {}) }`
for POST; the same substitution inside `updated` for PUT). Import `reqSiteUrl` from
`@data-fair/lib-express` and `nhiIssuerUrl` from `../nhi/operations.ts`.

**This overwrite is a security boundary, not a convenience.** `readOnly` in the schema is
only a form hint — ajv does not enforce it, the write-req validator accepts
`nhi.siteUrl`/`nhi.issuer` as known string keys, and `additionalProperties: false` only
rejects unknown keys. So the object you build must be constructed from `clientId` plus the
two request-derived values and must never merge anything else out of `body.nhi`. Take
`clientId` from the body; take both other fields from the request, unconditionally, even
when the body supplied them.

Note the PUT must re-capture rather than preserve the old values: an admin re-saving from
a different host is telling us the site url changed, and the enrolment check in Task 5
will immediately verify whether the new one actually works.

Then the route itself, which exists so the exchange is observable end to end. It returns
the *identity obtained*, never the cookie.

In `api/src/autonomous-agents/router.ts`, add (registered after the existing `/:type/:id/:agentId` GET, before nothing else — order does not matter here since the path is longer and literal):

```ts
router.get('/:type/:id/:agentId/session', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const autonomousAgent = await getAutonomousAgent(owner, req.params.agentId)
    if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')
    res.json(await describeAutonomousAgentSession(autonomousAgent))
  } catch (err) { next(err) }
})
```

Add to `api/src/autonomous-agents/service.ts`:

```ts
import { getAutonomousAgentSession, type EnrolledAutonomousAgent } from '../nhi/service.ts'
import { decodeSessionClaims } from '../nhi/operations.ts'

/**
 * Obtain a session for this autonomous agent and report WHICH identity it got, without
 * ever returning the cookie. Diagnostic surface for admins, and the end-to-end proof
 * that issuer/jwks/claims/audience agree.
 */
export const describeAutonomousAgentSession = async (autonomousAgent: EnrolledAutonomousAgent) => {
  const cookieHeader = await getAutonomousAgentSession(autonomousAgent)
  const claims = decodeSessionClaims(cookieHeader)
  return {
    userId: claims.id,
    userName: claims.name,
    organization: claims.organization?.id,
    nhi: claims.nhi === 1 || claims.nhi === true,
    expiresIn: typeof claims.exp === 'number' ? Math.max(0, claims.exp - Math.floor(Date.now() / 1000)) : undefined
  }
}
```

Add the decoder to `api/src/nhi/operations.ts` — pure, so it is unit-tested rather than trusted:

```ts
/**
 * simple-directory splits the session JWT across two cookies: `id_token` carries
 * `header.payload` and `id_token_sign` the signature (hence the cookie list in
 * lib-express's unsetCookies). So the claims are the SECOND dot-separated segment of
 * `id_token`, base64url-encoded.
 *
 * Deliberately does NOT verify the signature, and nothing may be authorized on the
 * strength of what it returns: this process just obtained the token from
 * simple-directory itself, and this is a diagnostic read of claims we already hold.
 */
export function decodeSessionClaims (cookieHeader: string): Record<string, any> {
  const pair = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('id_token='))
  if (!pair) throw new Error('no id_token cookie in the session')
  const segments = pair.slice('id_token='.length).split('.')
  if (segments.length < 2) throw new Error('id_token cookie is not a header.payload pair')
  return JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'))
}
```

and its unit tests, appended to `tests/features/autonomous-agents/nhi.unit.spec.ts` (add `decodeSessionClaims` to the import):

```ts
test.describe('decodeSessionClaims', () => {
  const claims = { id: 'nhi-abc', name: 'agent', organization: { id: 'test1' }, nhi: 1, exp: 1_700_000_300 }
  const idToken = 'eyJhbGciOiJSUzI1NiJ9.' + Buffer.from(JSON.stringify(claims)).toString('base64url')

  test('reads the claims out of the id_token cookie', () => {
    assert.deepEqual(decodeSessionClaims(`id_token=${idToken}; id_token_sign=zzz`), claims)
  })

  test('finds id_token regardless of position', () => {
    assert.equal(decodeSessionClaims(`id_token_sign=zzz; id_token=${idToken}`).id, 'nhi-abc')
  })

  test('throws when there is no id_token cookie', () => {
    assert.throws(() => decodeSessionClaims('id_token_sign=zzz'), /no id_token cookie/)
  })

  test('throws on a cookie that is not a header.payload pair', () => {
    assert.throws(() => decodeSessionClaims('id_token=nodots'), /header.payload pair/)
  })
})
```

- [ ] **Step 9: Run the tests**

Run: `npm run test-api -- tests/features/autonomous-agents/nhi-exchange.api.spec.ts`
Expected: PASS (2 tests).

If the enrolment POST in step 7 fails, the NHI management endpoint shape may differ from what this plan assumes. Read `~/data-fair/simple-directory/api/src/nhis/router.ts` and `api/doc/nhis/post-req/schema.js` for the real request body, adjust the test, and report the difference.

- [ ] **Step 10: Commit**

```bash
git add api/src/nhi api/src/autonomous-agents tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): mint nhi assertions and exchange them for sessions"
```

---

### Task 5: Verify the enrolment when it is saved

**Files:**
- Modify: `api/src/autonomous-agents/router.ts` (POST and PUT verify a newly set `nhi.clientId`)
- Modify: `api/src/autonomous-agents/service.ts` (add `assertEnrolmentWorks`)
- Modify: `tests/features/autonomous-agents/nhi-exchange.api.spec.ts` (add cases)

**Interfaces:**
- Consumes: `getAutonomousAgentSession`, `clearAutonomousAgentSession` (Task 4).
- Produces: `assertEnrolmentWorks(autonomousAgent): Promise<void>`

**Why:** nhi-proxy's `enroll` performs a real exchange immediately so a misconfiguration surfaces at configuration time rather than inside the first run. Without this, a typo'd `client_id` or a mismatched subject is only discovered when an autonomous agent silently fails to reach any tool.

**MANDATORY — this task breaks an existing test on purpose, and must convert it rather than
delete or re-guard it.** `nhi-exchange.api.spec.ts`'s "a client-supplied nhi.siteUrl /
nhi.issuer is discarded, not trusted" currently creates an autonomous agent with a bogus
`clientId: 'nhi-whatever'` and asserts the captured values beat the attacker-supplied ones.
Once enrolment verification exists that POST is rejected before insert, so the agent is
never created and its `assert.ok(stored, …)` fails — deliberately, with a message saying
what to do. Convert it to assert the **rejection** path: the POST is refused 400, the error
names the unverifiable identity, and no autonomous agent with that title exists afterwards.
Do NOT restore an `if (stored)`-style guard: that is exactly what made the test silently
decay into zero assertions, and it is the failure mode this branch has produced repeatedly.

- [ ] **Step 1: Write the failing tests**

Append inside the existing `test.describe` in `tests/features/autonomous-agents/nhi-exchange.api.spec.ts`:

```ts
  test('saving a bogus nhi.clientId is refused at configuration time', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Bad enrolment', persona: 'x', mcpServers: [], toolDisclosure: 'static', enabled: true
    })
    await assert.rejects(
      admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, {
        title: 'Bad enrolment', persona: 'x', mcpServers: [], toolDisclosure: 'static', enabled: true,
        nhi: { clientId: 'nhi-doesnotexist' }
      }),
      (err: any) => { assert.equal(err.status, 400); assert.match(JSON.stringify(err.data), /could not be verified/); return true }
    )
  })

  test('an unchanged nhi.clientId is not re-verified on every save', async () => {
    // create + enrol exactly as the first test does
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Stable', persona: 'x', mcpServers: [], toolDisclosure: 'static', enabled: true
    })
    const agentId = created.data.id
    const nhi = await orgAdmin.post(`${directoryUrl}/api/organizations/test1/nhis`, {
      name: `autonomous-agent-${agentId}`, provider: { issuer }, subject: `autonomous-agent:${agentId}`
    })
    const body = { title: 'Stable', persona: 'x', mcpServers: [], toolDisclosure: 'static', enabled: true, nhi: { clientId: nhi.data.id } }
    await admin.put(`/api/autonomous-agents/organization/test1/${agentId}`, body)

    // a second save with the same clientId must succeed. The exchange endpoint is
    // rate-limited per client_id and consumes a point even on success, so re-verifying
    // an unchanged enrolment on every edit would burn that budget for nothing.
    const again = await admin.put(`/api/autonomous-agents/organization/test1/${agentId}`, { ...body, title: 'Stable renamed' })
    assert.equal(again.status, 200)
    assert.equal(again.data.title, 'Stable renamed')
  })
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test-api -- tests/features/autonomous-agents/nhi-exchange.api.spec.ts`
Expected: the bogus-clientId test FAILS (the PUT currently succeeds).

- [ ] **Step 3: Implement the verification**

Add to `api/src/autonomous-agents/service.ts`:

```ts
/**
 * Perform a real exchange so a misconfigured enrolment fails at configuration time
 * rather than inside the first run — the lesson nhi-proxy's `enroll` encodes.
 *
 * Called only when the clientId CHANGED: the exchange is rate-limited per client_id and
 * consumes a point on success too, so re-verifying an unchanged enrolment on every edit
 * would spend that budget for nothing.
 */
export const assertEnrolmentWorks = async (autonomousAgent: EnrolledAutonomousAgent) => {
  clearAutonomousAgentSession(autonomousAgent.id)
  try {
    await getAutonomousAgentSession(autonomousAgent)
  } catch (err: any) {
    throw httpError(400, `the non-human identity "${autonomousAgent.nhi?.clientId}" could not be verified against simple-directory: ${err.message}. Check that the NHI exists, that its issuer is ${autonomousAgent.nhi?.issuer} and that its subject is ${autonomousAgentSubject(autonomousAgent.id)}.`)
  }
}
```

In `api/src/autonomous-agents/router.ts`, in the POST handler after the document is assembled and before `insertOne`:

```ts
    if (autonomousAgent.nhi?.clientId) await assertEnrolmentWorks(autonomousAgent)
```

and in the PUT handler after `updated` is assembled and before `replaceOne`:

```ts
    // only when it changed — see assertEnrolmentWorks
    if (updated.nhi?.clientId && updated.nhi.clientId !== existing.nhi?.clientId) await assertEnrolmentWorks(updated)
```

Import `assertEnrolmentWorks` in the router and `clearAutonomousAgentSession`, `autonomousAgentSubject` in the service.

- [ ] **Step 4: Run to verify they pass**

Run: `npm run test-api -- tests/features/autonomous-agents/nhi-exchange.api.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add api/src/autonomous-agents tests/features/autonomous-agents/nhi-exchange.api.spec.ts
git commit -m "feat(autonomous-agents): verify a new nhi enrolment at configuration time"
```

---

### Task 6: The MCP client — transport, credentials, tool wrapping

**Files:**
- Create: `api/src/mcp-servers/client.ts`
- Create: `api/src/mcp-servers/tool-result.ts`
- Modify: `api/src/mcp-servers/operations.ts` (add `credentialHeaders`)
- Create: `tests/features/autonomous-agents/mcp-client.unit.spec.ts`
- Modify: `tests/features/autonomous-agents/mcp-catalog.unit.spec.ts` (add `credentialHeaders` cases)

**Interfaces:**
- Consumes: `GlobalMcpServer` (Plan A), `getAutonomousAgentSession` (Task 4).
- Produces:
  - `credentialHeaders(server: GlobalMcpServer, cookieHeader: string | undefined): Record<string, string>`
  - `formatMcpToolResult(callResult): string | { _agentsMediaResult: true, text?: string, media: {data,mediaType}[] }`
  - `connectMcpServer(server: GlobalMcpServer, cookieHeader?: string): Promise<{ client, close }>`
  - `listAutonomousAgentTools(autonomousAgent): Promise<Record<string, Tool>>` — AI SDK tools keyed by name

**Reuse note:** `formatMcpToolResult` is ported from `ui/src/utils/tool-result.ts` rather than reinvented, keeping the media-envelope contract the gateway already decodes. It is a pure function; copy it verbatim and keep its comments. (Plan C moves the single copy to `shared/`; duplicating it here and de-duplicating there is deliberate — Plan C is where the cross-workspace import mechanism gets built and validated.)

- [ ] **Step 1: Write the failing tests**

Create `tests/features/autonomous-agents/mcp-client.unit.spec.ts`:

```ts
/**
 * stateless unit tests for MCP credential selection and tool-result formatting
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { credentialHeaders, type GlobalMcpServer } from '../../../api/src/mcp-servers/operations.ts'
import { formatMcpToolResult } from '../../../api/src/mcp-servers/tool-result.ts'

const cookie = 'id_token=abc; id_token_sign=def'

const server = (over: Partial<GlobalMcpServer> = {}): GlobalMcpServer =>
  ({ id: 's', name: 'S', url: 'https://x/mcp', auth: 'none', ...over })

test.describe('credentialHeaders', () => {
  test('auth "nhi-session" replays the session as a Cookie header', () => {
    assert.deepEqual(credentialHeaders(server({ auth: 'nhi-session' }), cookie), { cookie })
  })

  test('auth "none" sends no credential even when a session exists', () => {
    assert.deepEqual(credentialHeaders(server({ auth: 'none' }), cookie), {})
  })

  test('auth "apiKey" sends the configured header and never the cookie', () => {
    const headers = credentialHeaders(server({ auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'secret' }), cookie)
    assert.deepEqual(headers, { 'x-api-key': 'secret' })
    assert.equal(JSON.stringify(headers).includes('id_token'), false)
  })

  test('auth "nhi-session" with no session throws rather than calling unauthenticated', () => {
    // silently dropping the credential would make the call run as anonymous and the
    // failure would surface as a confusing permission error from the far end
    assert.throws(() => credentialHeaders(server({ auth: 'nhi-session' }), undefined), /requires a session/)
  })
})

test.describe('formatMcpToolResult', () => {
  test('joins text parts', () => {
    assert.equal(formatMcpToolResult({ content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }), 'a\nb')
  })

  test('prefixes an error result', () => {
    assert.equal(formatMcpToolResult({ content: [{ type: 'text', text: 'boom' }], isError: true }), 'Tool execution failed: boom')
  })

  test('wraps image parts in the media envelope the gateway decodes', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'see' }, { type: 'image', data: 'AAAA', mimeType: 'image/png' }] })
    assert.deepEqual(out, { _agentsMediaResult: true, text: 'see', media: [{ data: 'AAAA', mediaType: 'image/png' }] })
  })

  test('falls back to the serialized result when there is no text part', () => {
    assert.equal(formatMcpToolResult({ content: [] }), JSON.stringify({ content: [] }))
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/mcp-client.unit.spec.ts`
Expected: FAIL — neither `credentialHeaders` nor `tool-result.ts` exists.

- [ ] **Step 3: Implement `credentialHeaders`**

Append to `api/src/mcp-servers/operations.ts`:

```ts
/**
 * The credential headers for one catalog entry.
 *
 * A cookie is used rather than a bearer token because @data-fair/lib-express reads
 * sessions from the id_token / id_token_sign cookies only and parses no Authorization
 * header — the same constraint nhi-proxy works around by relaying Set-Cookie.
 */
export function credentialHeaders (server: GlobalMcpServer, cookieHeader: string | undefined): Record<string, string> {
  if (server.auth === 'nhi-session') {
    // Refuse rather than silently omit: an unauthenticated call would run as anonymous
    // and fail at the far end as a confusing permission error instead of here.
    if (!cookieHeader) throw new Error(`MCP server "${server.id}" requires a session but none was supplied`)
    return { cookie: cookieHeader }
  }
  if (server.auth === 'apiKey') {
    if (!server.apiKeyHeader || !server.apiKey) throw new Error(`MCP server "${server.id}" is missing its apiKey configuration`)
    return { [server.apiKeyHeader]: server.apiKey }
  }
  return {}
}
```

- [ ] **Step 4: Port `formatMcpToolResult`**

Create `api/src/mcp-servers/tool-result.ts` by copying `ui/src/utils/tool-result.ts` **verbatim**, including its types and comments. Do not change behaviour: the media envelope shape is a contract the gateway's `convertOpenAIMessages` already decodes.

- [ ] **Step 5: Run to verify the unit tests pass**

Run: `npm run test-unit -- tests/features/autonomous-agents/mcp-client.unit.spec.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Implement the client**

Create `api/src/mcp-servers/client.ts`:

```ts
/**
 * Connects to the MCP servers an autonomous agent is configured with, as that agent's
 * own identity, and exposes their tools as AI SDK tools.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { tool, jsonSchema, type Tool } from 'ai'
import config from '#config'
import { httpError } from '@data-fair/lib-express'
import Debug from 'debug'
import { credentialHeaders, type GlobalMcpServer } from './operations.ts'
import { formatMcpToolResult } from './tool-result.ts'
import { getAutonomousAgentSession } from '../nhi/service.ts'

const debug = Debug('agents:mcp-client')

export const connectMcpServer = async (server: GlobalMcpServer, cookieHeader?: string) => {
  const headers = credentialHeaders(server, cookieHeader)
  const transport = new StreamableHTTPClientTransport(new URL(server.url), { requestInit: { headers } })
  const client = new Client({ name: 'data-fair-agents', version: '1.0.0' })
  await client.connect(transport)
  return { client, close: async () => { await client.close() } }
}

/**
 * The tool set for one autonomous agent: every tool of every catalog entry it
 * references, narrowed by that reference's optional toolFilter.
 *
 * A session is obtained lazily and only once: an autonomous agent whose entries are all
 * `none`/`apiKey` performs no exchange at all.
 */
export const listAutonomousAgentTools = async (autonomousAgent: {
  id: string
  nhi?: { clientId: string }
  mcpServers?: { serverId: string, toolFilter?: string[] }[]
}): Promise<Record<string, Tool>> => {
  const catalog = config.mcpServers ?? []
  const refs = autonomousAgent.mcpServers ?? []
  const needsSession = refs.some(ref => catalog.find(s => s.id === ref.serverId)?.auth === 'nhi-session')
  const cookieHeader = needsSession ? await getAutonomousAgentSession(autonomousAgent) : undefined

  const tools: Record<string, Tool> = {}
  for (const ref of refs) {
    const server = catalog.find(s => s.id === ref.serverId)
    if (!server) throw httpError(400, `unknown MCP server "${ref.serverId}"`)

    const { client, close } = await connectMcpServer(server, cookieHeader)
    try {
      const listed = await client.listTools()
      for (const t of listed.tools) {
        if (ref.toolFilter?.length && !ref.toolFilter.includes(t.name)) continue
        // Last-write-wins on a name collision across servers, matching the browser
        // aggregator's Object.assign semantics.
        tools[t.name] = tool({
          description: t.description ?? '',
          inputSchema: jsonSchema((t.inputSchema as any) ?? { type: 'object', properties: {} }),
          execute: async (args: any) => {
            debug('call tool=%s server=%s', t.name, server.id)
            // request() rather than callTool(): the latter also validates the result's
            // structuredContent against the declared outputSchema, and formatMcpToolResult
            // discards structuredContent, so that check could only reject an otherwise
            // usable call over a value we throw away.
            const callResult = await client.request({ method: 'tools/call', params: { name: t.name, arguments: args } }, CallToolResultSchema)
            return formatMcpToolResult(callResult as any)
          }
        })
      }
    } finally {
      await close()
    }
  }
  return tools
}
```

**Note on connection lifetime:** this opens and closes a connection per listing. That is correct for the diagnostic endpoint in Task 7 and for a single run, and deliberately avoids a pool whose invalidation rules nothing yet needs. Plan C revisits it if a long run makes the reconnect cost visible.

- [ ] **Step 7: Verify it compiles and the suites pass**

Run: `npm run lint-fix && npm run check-types && npm run test-unit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add api/src/mcp-servers tests/features/autonomous-agents/mcp-client.unit.spec.ts
git commit -m "feat(autonomous-agents): mcp client with per-auth-mode credentials and tool wrapping"
```

---

### Task 7: The `/tools` endpoint — make it observable in staging

**Files:**
- Modify: `api/src/autonomous-agents/router.ts` (add the route)
- Create: `tests/support/mcp-fixture.ts`
- Create: `tests/features/autonomous-agents/mcp-tools.api.spec.ts`
- Modify: `api/config/development.js` (point a dev catalog entry at the fixture port)

**Interfaces:**
- Consumes: `listAutonomousAgentTools` (Task 6), `assertOrganizationOwner`, `getAutonomousAgent` (Plan A).
- Produces: `GET /api/autonomous-agents/:type/:id/:agentId/tools` → `{ results: [{ name, description, server, annotations }], count }`

**Consequence of Task 5 you must handle here.** Task 5 makes every save carrying an
`nhi.clientId` perform a real exchange and reject on failure. In this dev stack no NHI can
exist at all (`FileStorage.createUser` throws), so **no autonomous agent can be given a
working NHI in dev**. That makes one test in this task unreachable: "a session server
receives the autonomous agent's own NHI cookie", which needs a real enrolment. Skip that
one with the same reasoning as the skipped test in `nhi-exchange.api.spec.ts`, and leave its
body intact.

Everything else in this task is unaffected and must stay active — the fixture MCP server,
tool listing, `toolFilter`, the `none` and `apiKey` credential paths, the
no-secret-in-response assertion, and authorization. Those cover the endpoint's behaviour
without needing an identity, which is why this task remains a real deliverable despite the
gap.

**Why this route exists:** it is the deliverable. Without an executor there is no other way to see that identity and tools work end to end, and it is exactly what someone validating a staging deployment needs: create an autonomous agent, enrol it, point it at a server, and read back the real tool list fetched as that agent.

- [ ] **Step 1: Write the in-process MCP fixture**

Create `tests/support/mcp-fixture.ts`:

```ts
/**
 * A minimal in-process MCP server over streamable HTTP, used as the tool fixture.
 * It records the headers of the last request so tests can assert which credential the
 * client actually presented.
 */
import { createServer, type Server } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export interface McpFixture {
  port: number
  lastHeaders: () => Record<string, string | string[] | undefined>
  close: () => Promise<void>
}

export const startMcpFixture = async (port: number): Promise<McpFixture> => {
  let lastHeaders: Record<string, string | string[] | undefined> = {}

  const mcp = new McpServer({ name: 'fixture', version: '1.0.0' })
  mcp.registerTool(
    'echo',
    { description: 'Echoes its input back', inputSchema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] } as any },
    async ({ value }: any) => ({ content: [{ type: 'text', text: `echo:${value}` }] })
  )
  mcp.registerTool(
    'ignored',
    { description: 'Exists so toolFilter has something to exclude', inputSchema: { type: 'object', properties: {} } as any },
    async () => ({ content: [{ type: 'text', text: 'ignored' }] })
  )

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await mcp.connect(transport)

  const server: Server = createServer((req, res) => {
    lastHeaders = req.headers
    transport.handleRequest(req, res).catch(() => { res.statusCode = 500; res.end() })
  })
  await new Promise<void>(resolve => server.listen(port, '127.0.0.1', resolve))

  return {
    port,
    lastHeaders: () => lastHeaders,
    close: async () => { await new Promise<void>(resolve => server.close(() => resolve())) }
  }
}
```

**If the SDK's server-side API differs** (`registerTool`'s signature, or `StreamableHTTPServerTransport`'s options), read `node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.d.ts` and `.../server/streamableHttp.d.ts` and adjust. Report what you changed. Do not stub the MCP protocol by hand — the point of this fixture is that a real client-server handshake happens.

- [ ] **Step 2: Point a dev catalog entry at the fixture**

In `api/config/development.js`, replace the two placeholder entries' unreachable urls so the `none` entry targets the fixture, and keep a `nhi-session` entry:

```js
  // The api-test MCP fixture (tests/support/mcp-fixture.ts) listens on this port. It is
  // DERIVED, not hardcoded: dev/init-env.sh assigns a RANDOM base port and allocates
  // base..base+22, so any literal port is free on one checkout and taken on another (and in
  // CI). +30 sits clear of that range. The test computes the same expression.
  mcpServers: (() => {
    const fixtureUrl = `http://localhost:${Number(process.env.NGINX_PORT) + 30}/mcp`
    return [
      { id: 'dev-public-mcp', name: 'Dev Public MCP', url: fixtureUrl, auth: 'none' },
      { id: 'dev-session-mcp', name: 'Dev Session MCP', url: fixtureUrl, auth: 'nhi-session' },
      { id: 'dev-apikey-mcp', name: 'Dev API-key MCP', url: fixtureUrl, auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'dev-secret-value' }
    ]
  })(),
```

Do NOT hardcode a port. `dev/init-env.sh` sets `NGINX_PORT=$((1024 + RANDOM % 48000))` and allocates `base..base+22`, so a literal port is free on one checkout and taken on another — the same trap that rules out a committed fixture issuer. `+30` is clear of the range. Then `npm run build-types`, `touch api/index.ts`, and confirm `dev-api` is UP.

- [ ] **Step 3: Write the failing test**

Create `tests/features/autonomous-agents/mcp-tools.api.spec.ts`:

```ts
/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const issuer = `http://localhost:${process.env.NGINX_PORT}/agents/api/nhi`

let fixture: McpFixture

const agentBody = (over: any = {}) => ({
  title: 'Tool probe', persona: 'x', mcpServers: [{ serverId: 'dev-public-mcp' }], toolDisclosure: 'static', enabled: true, ...over
})

test.describe('Autonomous agent tools', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean() })

  test('lists the real tools of a public MCP server', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody())
    const res = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    assert.equal(res.status, 200)
    const names = res.data.results.map((t: any) => t.name).sort()
    assert.deepEqual(names, ['echo', 'ignored'])
    assert.equal(res.data.results.find((t: any) => t.name === 'echo').server, 'dev-public-mcp')
  })

  test('toolFilter narrows the set', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody({ mcpServers: [{ serverId: 'dev-public-mcp', toolFilter: ['echo'] }] }))
    const res = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    assert.deepEqual(res.data.results.map((t: any) => t.name), ['echo'])
  })

  test('a public server receives no credential', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody())
    await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    const headers = fixture.lastHeaders()
    assert.equal(headers.cookie, undefined)
    assert.equal(headers['x-api-key'], undefined)
  })

  test('an apiKey server receives the ops-configured header, and the secret never reaches the response', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody({ mcpServers: [{ serverId: 'dev-apikey-mcp' }] }))
    const res = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    assert.equal(fixture.lastHeaders()['x-api-key'], 'dev-secret-value')
    assert.equal(JSON.stringify(res.data).includes('dev-secret-value'), false)
  })

  test('a session server receives the autonomous agent\'s own NHI cookie', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody({ mcpServers: [{ serverId: 'dev-session-mcp' }] }))
    const agentId = created.data.id
    const nhi = await orgAdmin.post(`${directoryUrl}/api/organizations/test1/nhis`, {
      name: `autonomous-agent-${agentId}`, provider: { issuer }, subject: `autonomous-agent:${agentId}`
    })
    await admin.put(`/api/autonomous-agents/organization/test1/${agentId}`, agentBody({ mcpServers: [{ serverId: 'dev-session-mcp' }], nhi: { clientId: nhi.data.id } }))

    const res = await admin.get(`/api/autonomous-agents/organization/test1/${agentId}/tools`)
    assert.equal(res.status, 200)
    // THE point of this plan: the far end saw a session, and it is the agent's own
    const cookie = String(fixture.lastHeaders().cookie ?? '')
    assert.match(cookie, /id_token=/)
    assert.equal(JSON.stringify(res.data).includes('id_token'), false)
  })

  test('a session server with no enrolled identity is refused rather than called anonymously', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody({ mcpServers: [{ serverId: 'dev-session-mcp' }] }))
    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`),
      (err: any) => { assert.equal(err.status, 400); assert.match(JSON.stringify(err.data), /non-human identity/); return true }
    )
  })

  test('a plain org member cannot read the tool list', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody())
    const orgMember = await axiosAuth('test1-user1', { org: 'test1' })
    await assert.rejects(
      orgMember.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`),
      (err: any) => { assert.equal(err.status, 403); assert.match(JSON.stringify(err.data), /requires admin/); return true }
    )
  })
})
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm run test-api -- tests/features/autonomous-agents/mcp-tools.api.spec.ts`
Expected: FAIL with 404 — the route does not exist.

- [ ] **Step 5: Add the route**

In `api/src/autonomous-agents/router.ts`:

```ts
router.get('/:type/:id/:agentId/tools', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const autonomousAgent = await getAutonomousAgent(owner, req.params.agentId)
    if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')

    const results = await describeAutonomousAgentTools(autonomousAgent)
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})
```

In `api/src/autonomous-agents/service.ts`:

```ts
import { listAutonomousAgentToolDescriptors } from '../mcp-servers/client.ts'

/**
 * The tool list an autonomous agent would actually receive, fetched live as its own
 * identity. Descriptions and annotations only — never a credential.
 */
export const describeAutonomousAgentTools = async (autonomousAgent: { id: string, nhi?: { clientId: string }, mcpServers?: { serverId: string, toolFilter?: string[] }[] }) =>
  await listAutonomousAgentToolDescriptors(autonomousAgent)
```

And in `api/src/mcp-servers/client.ts`, add a descriptor-only variant beside `listAutonomousAgentTools` so the diagnostic endpoint does not build executable closures it will never call. Factor the shared connect-and-list loop rather than duplicating it:

```ts
export interface McpToolDescriptor {
  name: string
  description: string
  server: string
  annotations?: Record<string, unknown>
}

export const listAutonomousAgentToolDescriptors = async (autonomousAgent: Parameters<typeof listAutonomousAgentTools>[0]): Promise<McpToolDescriptor[]> => {
  const descriptors: McpToolDescriptor[] = []
  await forEachListedTool(autonomousAgent, (t, server) => {
    descriptors.push({
      name: t.name,
      description: t.description ?? '',
      server: server.id,
      // readOnlyHint / destructiveHint drive the approval gate in P1 and are recorded
      // per call in the run; surfacing them here lets an admin see the write surface
      // before an autonomous agent is ever run.
      ...(t.annotations ? { annotations: t.annotations as Record<string, unknown> } : {})
    })
  })
  return descriptors
}
```

Extract `forEachListedTool(autonomousAgent, visit)` from the body of `listAutonomousAgentTools` (session resolution, catalog lookup, connect, `listTools`, `toolFilter`, `finally close`) and have both exports use it. There must be exactly one copy of that loop.

- [ ] **Step 6: Run to verify it passes**

Run: `npm run test-api -- tests/features/autonomous-agents/mcp-tools.api.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Run everything**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api && npm run test-e2e`
Expected: all PASS. (e2e needs `lib-vuetify` and `lib-vue` built: `cd lib-vuetify && npm run build`, `cd ../lib-vue && npm run build`.)

- [ ] **Step 8: Document the staging verification procedure**

Append a short section to `docs/architecture/configuration.md`, after the `MCP_SERVERS` section, titled **Verifying an autonomous agent's identity and tools**, listing the steps an operator follows: set `PUBLIC_URL` and `NHI_SIGNING_KEY`; confirm `GET <PUBLIC_URL>/api/nhi/.well-known/openid-configuration` resolves; create an autonomous agent; register the NHI in simple-directory with that issuer and subject `autonomous-agent:<id>`; PUT the returned `nhi-…` id onto the agent (a bad id is refused immediately); then `GET …/:agentId/session` to see which identity it obtained and `GET …/:agentId/tools` to see the live tool list. Mention that simple-directory must run with `manageNhis` enabled. State plainly that
**`allowedIps` and `ipBinding` must not be set on an autonomous agent's NHI**: both key
off the address this service declares rather than a real client address, so configuring
them against a pod IP breaks either the exchange or the session it issues. Also note that
NHI management is a one-time UI action precisely because discovery keeps the record valid
across key rotations.

- [ ] **Step 9: Commit**

```bash
git add api/src/autonomous-agents api/src/mcp-servers tests/support/mcp-fixture.ts tests/features/autonomous-agents/mcp-tools.api.spec.ts api/config/development.js docs/architecture/configuration.md
git commit -m "feat(autonomous-agents): list an autonomous agent's live tools as its own identity"
```

---

## Done when

- The issuer serves a discovery document and JWKS, and the published key verifies an assertion this service signs.
- An enrolled autonomous agent obtains a real simple-directory session whose identity is its own NHI, capped by the assertion TTL.
- A bad enrolment is refused at configuration time, and an unchanged one is not re-verified on every save.
- `GET …/:agentId/tools` returns the live tool list, with the credential each server receives matching its `auth` mode — proven by a fixture that records the headers it was sent.
- No credential (cookie, `apiKey`, signing key) appears in any response body.
- `lint-fix`, `check-types`, `test-unit`, `test-api`, `test-e2e` all pass.

## Outstanding after execution

- **The real NHI exchange is not provable in this dev stack** (the skipped test in
  `tests/features/autonomous-agents/nhi-exchange.api.spec.ts`). simple-directory runs
  `STORAGE_TYPE=file`, as every data-fair dev stack does, and `FileStorage.createUser`
  (`api/src/storages/file.ts:250`) throws `Method not implemented.`, so
  `POST /api/organizations/:id/nhis` 500s and no NHI can be created. The 401 probe in Task 1
  could not catch this: it exercises the *exchange* route, not NHI *creation*.

  Three ways to close it, in the order I would try them:

  1. **A dev-only seeding route plus a port-free fixture NHI.** This repo already has
     `/api/test-env/*` routes under `NODE_ENV=development`. Add one that upserts an
     autonomous agent with a chosen id, and commit a fixture NHI in
     `dev/resources/users.json` whose `provider` carries an **inline jwks** (the dev public
     key) and whose issuer uses a port-free synthetic host. The inline jwks means
     simple-directory never fetches the issuer, so the host need not resolve, and the
     random `NGINX_PORT` stops mattering. Most contained. Open question to settle first:
     whether simple-directory tolerates an unknown `Host` for site resolution, or whether
     `reqSite` must resolve to the main site.
  2. **Build mongo-storage seeding.** Switch `STORAGE_TYPE` to mongo and have
     `dev/fixtures.ts` create the users and organizations through simple-directory's API.
     Matches staging exactly. Costly: `users.json`/`organizations.json` are FileStorage-only
     (read with `readFileSync` at construction), so every test identity disappears and all
     190 api + 123 e2e tests fail until seeding is correct. It also diverges from every
     sibling data-fair dev stack.
  3. **Leave it, and prove the exchange in staging**, where simple-directory runs mongo
     storage and an org admin creates the NHI through the UI — the designed path.

  What the gap actually risks: a mismatch in the audience, the site path or the issuer would
  not surface until staging. The declare/sign invariant most likely to break is covered at
  unit level in `nhi.unit.spec.ts`, which narrows but does not eliminate it.

- **`dev/init-env.sh` randomises every dev port** (`1024 + RANDOM % 48000`). Anything that
  needs a committed, environment-independent url cannot embed a dev port. This is why
  option 1 above requires a synthetic host.

- **No 401-triggered session refresh.** The spec says the jar refreshes at ~80% of expiry
  *and on any 401*; only the first exists. `clearAutonomousAgentSession` is called only
  from `assertEnrolmentWorks` (and now, on delete, from the router), and
  `forEachListedTool` does not catch a 401 from an MCP server and retry with a fresh
  session. An NHI deleted in simple-directory underneath a live autonomous agent, or a
  session expiring mid-listing, produces an unexplained far-end permission error with a
  dead cookie cached for up to ~60s. Plan C must add the retry.

- **Rotation overlap is promised but not expressible.** `config.nhiSigningKey` holds one
  key and the JWKS publishes exactly one, yet the spec and `configuration.md` describe
  publishing a new `kid` alongside the old. Nothing in Plan B needs overlap, but an
  operator following that text will find no way to do it, and the real rotation behaviour
  — up to ~30s of `JWKSNoMatchingKey` 401s while jose's `createRemoteJWKSet` cooldown
  elapses — is undocumented and looks identical to a misconfiguration. Either make the
  config an array or correct the prose.

- **`expires_in` has never been seen from a real simple-directory response.**
  `exchangeForSession` falls back to 300s if it is absent; if the field is missing or in
  milliseconds, the refresh margin is wrong and the only symptom is a stale-cookie 401
  with no retry (see above). Confirm it when the environment gap closes.

## Carried forward from Plan A

Pick these up here if convenient; none block this plan:

- **The cross-account WRITE test** (~6 lines), now meaningful since the write routes run `assertAccountRole` before the rollout gate: `orgAdmin` against `organization/dev1` must be refused with `requires admin role(s)`.
- The list-scoping test would pass with the owner filter deleted; no anonymous-401 test on any route; nothing pins the server-owned-field rejection; `mcpServers` has no duplicate-`serverId` guard; two exported types are both named `AutonomousAgent`.

## Deliberately deferred to Plan C

- The `shared/` extraction, and de-duplicating `formatMcpToolResult` into it. **When that
  happens, reconsider two warts characterised by tests in
  `tests/features/autonomous-agents/mcp-client.unit.spec.ts`** (verified against the live
  `ui/src/utils/tool-result.ts`, so they are pre-existing, not introduced by Plan B):
  a present-but-empty `content: []` returns `''` rather than falling back to the serialized
  result (the `??` only catches null/undefined, so the fallback fires only when `content` is
  absent entirely), and an errored result with no text returns the bare prefix
  `'Tool execution failed: '`, which tells a model nothing about what failed. Both are pinned
  by characterisation tests so a fix has to update them deliberately.
- Conversations, messages, runs, the executor, per-conversation locking, budgets.
- Websockets and the UI.
- Trace integration.
- Any MCP connection pooling or reuse across runs.
