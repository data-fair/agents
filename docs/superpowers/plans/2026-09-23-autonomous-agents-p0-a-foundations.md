# Autonomous Agents P0-A (Foundations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An ops-owned global MCP server catalog, and account-scoped CRUD for autonomous agent definitions validated against it.

**Architecture:** `MCP_SERVERS` is a deployment env var validated fail-fast at boot, exactly like the existing `PROVIDERS`/`MODELS`. Autonomous agents are documents in a new `autonomous-agents` collection, owned by an account, written by its admins through account-scoped routes that mirror `api/src/catalog/router.ts`. An agent references catalog entries by id; write-time validation rejects unknown ids. A deployment flag additionally requires admin mode on writes during progressive rollout.

**Tech Stack:** Node 24 (native TS stripping, `.ts` run directly), Express 5, MongoDB, `node-config` + JSON-Schema boot validation, `@data-fair/lib-express` for session/auth, Playwright (projects: `unit`, `api`, `e2e`).

**Spec:** `docs/superpowers/specs/2026-09-22-autonomous-agents-p0-design.md`

## Scope

This is plan **A of three** for P0:

- **A (this plan)** — MCP catalog + autonomous agent CRUD. API only.
- **B** — NHI issuer, assertion, exchange, cookie jar, MCP client, tool wrapping.
- **C** — conversations/messages/runs, executor, websockets, UI pages, traces; **and** the `shared/` extraction of the loop modules, which moves here from spec step 1 because Plan C is where its only new consumer lives.

Out of scope for A: anything that runs a model, any websocket, any UI.

## Global Constraints

- **Naming:** "autonomous agent" written out in every identifier, route, collection and user-facing string. Never a bare `agent`. The service is already called `agents` and its in-page assistant is "the agent". Hyphenated prose compounds (`per-agent`) are the only exception.
- **Module conventions** (`AGENTS.md`): `operations.ts` holds pure stateless functions and must not import `#mongo` or `#config`; `service.ts` holds stateful logic; `router.ts` holds HTTP logic and is imported only by `app.ts`.
- **Types come from JSON schemas.** Edit `api/types/<name>/schema.js` or `api/doc/<name>/<req>/schema.js`, then run `npm run build-types`. Never hand-write the generated types.
- **Test projects:** `*.unit.spec.ts` (pure functions only), `*.api.spec.ts` (HTTP via axios helpers), `*.e2e.spec.ts` (browser). New tests go in `tests/features/autonomous-agents/` — note `tests/features/agents/` already exists and is the *in-page* assistant.
- **Quality gate before every commit:** `npm run lint-fix`, `npm run check-types`.
- **Dev processes are user-managed.** Never start, stop or restart `dev-api`, `dev-ui` or docker compose. If a test fails with a connection error, run `bash dev/status.sh` and report.
- **`nhi` is optional on the document.** The NHI client id is pasted back after the admin creates the identity in simple-directory (Plan B). Enforcement that an autonomous agent cannot *run* without it belongs to the executor in Plan C, not to write validation here.

---

### Task 1: Global MCP server catalog config

**Files:**
- Create: `api/src/mcp-servers/operations.ts`
- Create: `tests/features/autonomous-agents/mcp-catalog.unit.spec.ts`
- Modify: `api/config/type/schema.json` (add `mcpServers` to `properties`)
- Modify: `api/config/default.js` (add `mcpServers: []`)
- Modify: `api/config/custom-environment-variables.js` (add the `MCP_SERVERS` mapping)
- Modify: `api/config/development.js` (add dev catalog entries)
- Modify: `api/src/config.ts` (call the boot validation)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type McpServerAuth = 'nhi-session' | 'none' | 'apiKey'`
  - `interface GlobalMcpServer { id: string, name: string, description?: string, url: string, auth: McpServerAuth, apiKeyHeader?: string, apiKey?: string }`
  - `interface McpServerCatalogEntry { id: string, name: string, description?: string, url: string, auth: McpServerAuth }`
  - `assertGlobalMcpConfig(servers: GlobalMcpServer[]): void`
  - `listMcpServerCatalog(servers: GlobalMcpServer[]): McpServerCatalogEntry[]`
  - `unknownMcpServerIds(servers: GlobalMcpServer[], refs: { serverId: string }[]): string[]`

- [ ] **Step 1: Write the failing test**

Create `tests/features/autonomous-agents/mcp-catalog.unit.spec.ts`:

```ts
/**
 * stateless unit tests for the global MCP server catalog config
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertGlobalMcpConfig, listMcpServerCatalog, unknownMcpServerIds, type GlobalMcpServer } from '../../../api/src/mcp-servers/operations.ts'

const servers: GlobalMcpServer[] = [
  { id: 'registry', name: 'Data Fair registry', url: 'https://example.org/mcp-registry/mcp', auth: 'nhi-session' },
  { id: 'public-docs', name: 'Public docs', url: 'https://example.org/docs-mcp/mcp', auth: 'none' },
  { id: 'third-party', name: 'Third party', url: 'https://third.example/mcp', auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'secret-value' }
]

test.describe('assertGlobalMcpConfig', () => {
  test('accepts a consistent config', () => {
    assertGlobalMcpConfig(servers)
  })

  test('accepts an empty catalog', () => {
    assertGlobalMcpConfig([])
  })

  test('rejects duplicate server ids', () => {
    assert.throws(() => assertGlobalMcpConfig([servers[0], { ...servers[1], id: 'registry' }]), /duplicate server id/)
  })

  test('rejects an unparseable url', () => {
    assert.throws(() => assertGlobalMcpConfig([{ ...servers[0], url: 'not a url' }]), /invalid url/)
  })

  test('rejects a non-http protocol', () => {
    assert.throws(() => assertGlobalMcpConfig([{ ...servers[0], url: 'ftp://example.org/mcp' }]), /must be http/)
  })

  test('rejects auth "apiKey" without apiKeyHeader', () => {
    const { apiKeyHeader, ...noHeader } = servers[2]
    assert.throws(() => assertGlobalMcpConfig([noHeader as GlobalMcpServer]), /requires apiKeyHeader/)
  })

  test('rejects auth "apiKey" without apiKey', () => {
    const { apiKey, ...noKey } = servers[2]
    assert.throws(() => assertGlobalMcpConfig([noKey as GlobalMcpServer]), /requires apiKey/)
  })

  test('rejects a credential on a server that does not use one', () => {
    assert.throws(() => assertGlobalMcpConfig([{ ...servers[1], apiKey: 'stray' }]), /must not carry apiKey/)
  })
})

test.describe('listMcpServerCatalog', () => {
  test('never exposes the credential', () => {
    const entries = listMcpServerCatalog(servers)
    const thirdParty = entries.find(e => e.id === 'third-party')
    assert.ok(thirdParty)
    assert.equal(JSON.stringify(entries).includes('secret-value'), false)
    assert.equal('apiKey' in thirdParty, false)
    assert.equal('apiKeyHeader' in thirdParty, false)
  })

  test('keeps the fields an admin picks by', () => {
    const entries = listMcpServerCatalog(servers)
    assert.deepEqual(entries[0], { id: 'registry', name: 'Data Fair registry', url: 'https://example.org/mcp-registry/mcp', auth: 'nhi-session' })
  })

  test('omits an absent description rather than emitting undefined', () => {
    const [entry] = listMcpServerCatalog([servers[0]])
    assert.equal('description' in entry, false)
  })
})

test.describe('unknownMcpServerIds', () => {
  test('returns the ids with no catalog entry', () => {
    assert.deepEqual(unknownMcpServerIds(servers, [{ serverId: 'registry' }, { serverId: 'nope' }]), ['nope'])
  })

  test('returns an empty array when every ref resolves', () => {
    assert.deepEqual(unknownMcpServerIds(servers, [{ serverId: 'registry' }, { serverId: 'public-docs' }]), [])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/mcp-catalog.unit.spec.ts`
Expected: FAIL — cannot resolve `api/src/mcp-servers/operations.ts`.

- [ ] **Step 3: Write the implementation**

Create `api/src/mcp-servers/operations.ts`:

```ts
/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

/**
 * How the MCP client authenticates to a server:
 * - nhi-session: the autonomous agent's NHI session cookie is injected (stack services)
 * - none:        no credential (public or network-trusted endpoints)
 * - apiKey:      a static ops-owned header (third-party servers with their own auth)
 */
export type McpServerAuth = 'nhi-session' | 'none' | 'apiKey'

/** A catalog entry as configured by ops in the MCP_SERVERS env var. */
export interface GlobalMcpServer {
  id: string
  name: string
  description?: string
  url: string
  auth: McpServerAuth
  /** only with auth: 'apiKey' */
  apiKeyHeader?: string
  /** only with auth: 'apiKey' — a deployment secret, never returned by the API */
  apiKey?: string
}

/** The same entry as exposed to org admins: identical minus the credential. */
export interface McpServerCatalogEntry {
  id: string
  name: string
  description?: string
  url: string
  auth: McpServerAuth
}

/**
 * Fail-fast boot validation, mirroring assertGlobalAiConfig: a malformed catalog
 * crashes the process at startup rather than failing on the first autonomous agent
 * that references it.
 */
export function assertGlobalMcpConfig (servers: GlobalMcpServer[]): void {
  const ids = new Set<string>()
  for (const server of servers) {
    if (ids.has(server.id)) throw new Error(`invalid global MCP config: duplicate server id "${server.id}"`)
    ids.add(server.id)

    let url: URL
    try {
      url = new URL(server.url)
    } catch {
      throw new Error(`invalid global MCP config: server "${server.id}" has an invalid url "${server.url}"`)
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`invalid global MCP config: server "${server.id}" url must be http(s), got "${url.protocol}"`)
    }

    if (server.auth === 'apiKey') {
      if (!server.apiKeyHeader) throw new Error(`invalid global MCP config: server "${server.id}" with auth "apiKey" requires apiKeyHeader`)
      if (!server.apiKey) throw new Error(`invalid global MCP config: server "${server.id}" with auth "apiKey" requires apiKey`)
    } else if (server.apiKey || server.apiKeyHeader) {
      // A credential on a server that will never send one is a configuration mistake
      // worth naming at boot: the operator believes the endpoint is authenticated.
      throw new Error(`invalid global MCP config: server "${server.id}" with auth "${server.auth}" must not carry apiKey/apiKeyHeader`)
    }
  }
}

/** Strip the credential. The only shape the API is allowed to return. */
export function listMcpServerCatalog (servers: GlobalMcpServer[]): McpServerCatalogEntry[] {
  return servers.map(server => ({
    id: server.id,
    name: server.name,
    url: server.url,
    auth: server.auth,
    ...(server.description ? { description: server.description } : {})
  }))
}

/** The referenced server ids that have no catalog entry, for write-time validation. */
export function unknownMcpServerIds (servers: GlobalMcpServer[], refs: { serverId: string }[]): string[] {
  const known = new Set(servers.map(s => s.id))
  return refs.map(ref => ref.serverId).filter(id => !known.has(id))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test-unit -- tests/features/autonomous-agents/mcp-catalog.unit.spec.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Add `mcpServers` to the config JSON schema**

In `api/config/type/schema.json`, add this to the top-level `properties` object, immediately after the `models` entry:

```json
"mcpServers": {
  "type": "array",
  "default": [],
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "name", "url", "auth"],
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" },
      "description": { "type": "string" },
      "url": { "type": "string" },
      "auth": { "type": "string", "enum": ["nhi-session", "none", "apiKey"] },
      "apiKeyHeader": { "type": "string" },
      "apiKey": { "type": "string" }
    }
  }
}
```

- [ ] **Step 6: Wire the config default, env mapping and dev entries**

In `api/config/default.js`, after the `models: [],` line:

```js
  mcpServers: [],
```

In `api/config/custom-environment-variables.js`, after the `models` line:

```js
  mcpServers: { __name: 'MCP_SERVERS', __format: 'json' },
```

In `api/config/development.js`, after the `defaultModels` line:

```js
  // Placeholder dev catalog: the URLs are deliberately unreachable. Plan A only
  // needs entries to exist so autonomous agents can reference them; Plan B replaces
  // these with a real in-process MCP fixture once there is a client to call it.
  mcpServers: [
    { id: 'dev-public-mcp', name: 'Dev Public MCP', url: 'http://localhost:1/mcp', auth: 'none' },
    { id: 'dev-session-mcp', name: 'Dev Session MCP', url: 'http://localhost:1/mcp', auth: 'nhi-session' }
  ],
```

- [ ] **Step 7: Call the boot validation**

In `api/src/config.ts`, add the import and the assertion:

```ts
import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import config from 'config'
import { assertGlobalAiConfig } from './models/operations.ts'
import { assertGlobalMcpConfig } from './mcp-servers/operations.ts'

assertValid(config, { lang: 'en', name: 'config', internal: true })

assertGlobalAiConfig((config as ApiConfig).providers ?? [], (config as ApiConfig).models ?? [], (config as ApiConfig).defaultModels ?? {})
assertGlobalMcpConfig((config as ApiConfig).mcpServers ?? [])

export default config as ApiConfig
```

- [ ] **Step 8: Regenerate types and verify the whole build**

Run: `npm run build-types && npm run check-types && npm run lint-fix`
Expected: no errors. `ApiConfig` now carries `mcpServers`.

Then run the full unit project to confirm nothing regressed:

Run: `npm run test-unit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add api/src/mcp-servers/operations.ts api/config tests/features/autonomous-agents/mcp-catalog.unit.spec.ts api/src/config.ts
git commit -m "feat(autonomous-agents): global MCP server catalog config"
```

---

### Task 2: Autonomous agent document — schema, types, storage, authorization

**Files:**
- Create: `api/types/autonomous-agent/schema.js`
- Create: `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js`
- Create: `api/src/autonomous-agents/operations.ts`
- Create: `tests/features/autonomous-agents/autonomous-agents.unit.spec.ts`
- Modify: `api/types/index.ts` (export the new schema and type)
- Modify: `api/src/mongo.ts` (collection accessor + indexes)
- Modify: `api/src/app.ts` (add the collection to the dev `test-env` cleanup)

**Interfaces:**
- Consumes: `GlobalMcpServer`, `unknownMcpServerIds` from Task 1.
- Produces:
  - Type `AutonomousAgent` (generated, exported from `#types`)
  - `interface InstructSession { user: { id: string, adminMode?: boolean }, account: { type: string, id: string }, accountRole?: string }`
  - `canInstruct(agent: Pick<AutonomousAgent, 'owner' | 'instructors'>, session: InstructSession): boolean`
  - `mongo.autonomousAgents` collection accessor
  - Validator `returnValid` at `#doc/autonomous-agents/autonomous-agent-write-req/index.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/autonomous-agents/autonomous-agents.unit.spec.ts`:

```ts
/**
 * stateless unit tests for autonomous agent authorization
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { canInstruct, type InstructSession } from '../../../api/src/autonomous-agents/operations.ts'

const agent = {
  owner: { type: 'organization', id: 'test1' },
  instructors: [{ userId: 'listed-user', userName: 'Listed User' }]
}

const session = (over: Partial<InstructSession> = {}): InstructSession => ({
  user: { id: 'someone' },
  account: { type: 'organization', id: 'test1' },
  accountRole: 'user',
  ...over
})

test.describe('canInstruct', () => {
  test('an admin of the owning account may instruct', () => {
    assert.equal(canInstruct(agent, session({ accountRole: 'admin' })), true)
  })

  test('a listed instructor may instruct even without a role', () => {
    assert.equal(canInstruct(agent, session({ user: { id: 'listed-user' } })), true)
  })

  test('a plain member of the owning account may not instruct', () => {
    assert.equal(canInstruct(agent, session()), false)
  })

  test('an admin of a DIFFERENT account may not instruct', () => {
    assert.equal(canInstruct(agent, session({ account: { type: 'organization', id: 'other' }, accountRole: 'admin' })), false)
  })

  test('a listed instructor coming from another account may still instruct', () => {
    assert.equal(canInstruct(agent, session({ user: { id: 'listed-user' }, account: { type: 'organization', id: 'other' } })), true)
  })

  test('a superadmin in admin mode may instruct', () => {
    assert.equal(canInstruct(agent, session({ user: { id: 'someone', adminMode: true } })), true)
  })

  test('an absent instructors list denies rather than throws', () => {
    assert.equal(canInstruct({ owner: agent.owner }, session()), false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/autonomous-agents.unit.spec.ts`
Expected: FAIL — cannot resolve `api/src/autonomous-agents/operations.ts`.

- [ ] **Step 3: Write the document schema**

Create `api/types/autonomous-agent/schema.js`:

```js
export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent',
  'x-exports': ['types'],
  title: 'Autonomous agent',
  'x-i18n-title': { en: 'Autonomous agent', fr: 'Agent autonome' },
  type: 'object',
  additionalProperties: false,
  required: ['id', 'owner', 'title', 'persona', 'mcpServers', 'toolDisclosure', 'enabled'],
  properties: {
    id: { type: 'string', readOnly: true },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      readOnly: true,
      properties: {
        type: { type: 'string', enum: ['user', 'organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    title: {
      type: 'string',
      title: 'Name',
      'x-i18n-title': { en: 'Name', fr: 'Nom' }
    },
    persona: {
      type: 'string',
      layout: 'textarea',
      title: 'Persona',
      'x-i18n-title': { en: 'Persona', fr: 'Persona' },
      description: 'Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.',
      'x-i18n-description': {
        en: 'Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.',
        fr: "Qui est cet agent autonome : son rôle, son ton et son périmètre. Devient le prompt système."
      }
    },
    instructions: {
      type: 'string',
      layout: 'textarea',
      title: 'Instructions',
      'x-i18n-title': { en: 'Instructions', fr: 'Instructions' },
      description: 'How it should work: procedures, constraints, what to do when unsure.',
      'x-i18n-description': {
        en: 'How it should work: procedures, constraints, what to do when unsure.',
        fr: "Comment il doit travailler : procédures, contraintes, conduite à tenir en cas de doute."
      }
    },
    mcpServers: {
      type: 'array',
      default: [],
      title: 'MCP servers',
      'x-i18n-title': { en: 'MCP servers', fr: 'Serveurs MCP' },
      description: 'Picked from the servers configured for this deployment.',
      'x-i18n-description': {
        en: 'Picked from the servers configured for this deployment.',
        fr: 'Choisis parmi les serveurs configurés pour ce déploiement.'
      },
      // eslint-disable-next-line no-template-curly-in-string
      layout: { itemTitle: 'item?.serverId || ""', listActions: ['add', 'edit', 'delete'] },
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['serverId'],
        properties: {
          serverId: {
            type: 'string',
            title: 'Server',
            'x-i18n-title': { en: 'Server', fr: 'Serveur' },
            layout: {
              comp: 'autocomplete',
              getItems: {
                // eslint-disable-next-line no-template-curly-in-string
                url: '${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers',
                itemsResults: 'data.results',
                itemTitle: 'item.name',
                itemKey: 'item.id',
                itemValue: 'item.id'
              }
            }
          },
          toolFilter: {
            type: 'array',
            title: 'Only these tools',
            'x-i18n-title': { en: 'Only these tools', fr: 'Uniquement ces outils' },
            description: 'Leave empty to expose every tool this server offers.',
            'x-i18n-description': {
              en: 'Leave empty to expose every tool this server offers.',
              fr: 'Laissez vide pour exposer tous les outils proposés par ce serveur.'
            },
            items: { type: 'string' }
          }
        }
      }
    },
    toolDisclosure: {
      type: 'string',
      enum: ['static', 'exploration'],
      default: 'static',
      title: 'Tool disclosure',
      'x-i18n-title': { en: 'Tool disclosure', fr: 'Exposition des outils' },
      description: '"static" sends every selected tool on every turn. "exploration" shows names only and lets the autonomous agent promote the ones it needs — use it when the selection is large.',
      'x-i18n-description': {
        en: '"static" sends every selected tool on every turn. "exploration" shows names only and lets the autonomous agent promote the ones it needs — use it when the selection is large.',
        fr: "« static » envoie tous les outils sélectionnés à chaque tour. « exploration » n'affiche que les noms et laisse l'agent autonome promouvoir ceux dont il a besoin — à utiliser quand la sélection est grande."
      }
    },
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
        }
      }
    },
    instructors: {
      type: 'array',
      default: [],
      title: 'Users allowed to instruct',
      'x-i18n-title': { en: 'Users allowed to instruct', fr: 'Utilisateurs autorisés à donner des instructions' },
      description: 'Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent\'s permissions.',
      'x-i18n-description': {
        en: 'Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent\'s permissions.',
        fr: "Les administrateurs de l'organisation propriétaire sont toujours autorisés. Toute personne listée ici emprunte les permissions de cet agent autonome."
      },
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['userId'],
        properties: {
          userId: { type: 'string', title: 'User id', 'x-i18n-title': { en: 'User id', fr: 'Identifiant utilisateur' } },
          userName: { type: 'string', title: 'User name', 'x-i18n-title': { en: 'User name', fr: 'Nom' } }
        }
      }
    },
    enabled: {
      type: 'boolean',
      default: true,
      title: 'Enabled',
      'x-i18n-title': { en: 'Enabled', fr: 'Activé' }
    },
    createdAt: { type: 'string', format: 'date-time', readOnly: true },
    updatedAt: { type: 'string', format: 'date-time', readOnly: true },
    createdBy: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      readOnly: true,
      properties: { id: { type: 'string' }, name: { type: 'string' } }
    }
  }
}
```

- [ ] **Step 4: Write the write-request schema**

Create `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js`. It picks the client-writable subset — `id`, `owner`, `createdAt`, `updatedAt` and `createdBy` are server-owned:

```js
import AutonomousAgentSchema from '#types/autonomous-agent/schema.js'

/** @param {'title' | 'persona' | 'instructions' | 'mcpServers' | 'toolDisclosure' | 'nhi' | 'instructors' | 'enabled'} key */
const pick = (key) => JSON.parse(JSON.stringify(AutonomousAgentSchema.properties[key]))

export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent/write-req',
  title: 'Autonomous agent',
  'x-i18n-title': { en: 'Autonomous agent', fr: 'Agent autonome' },
  'x-exports': ['validate', 'types', 'vjsf'],
  'x-vjsf': { xI18n: true, pluginsImports: ['@koumoul/vjsf-markdown'] },
  'x-vjsf-locales': ['en', 'fr'],
  type: 'object',
  additionalProperties: false,
  required: ['title', 'persona', 'mcpServers', 'toolDisclosure', 'enabled'],
  layout: { title: null },
  properties: {
    title: pick('title'),
    persona: pick('persona'),
    instructions: pick('instructions'),
    mcpServers: pick('mcpServers'),
    toolDisclosure: pick('toolDisclosure'),
    nhi: pick('nhi'),
    instructors: pick('instructors'),
    enabled: pick('enabled')
  }
}
```

- [ ] **Step 5: Write the authorization operations**

Create `api/src/autonomous-agents/operations.ts`:

```ts
/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

/**
 * The minimal session shape canInstruct reads. Structural rather than lib-express's
 * SessionState so the rule stays a pure function with a unit test that constructs its
 * own input.
 */
export interface InstructSession {
  user: { id: string, adminMode?: boolean }
  account: { type: string, id: string }
  accountRole?: string
}

interface InstructableAgent {
  owner: { type: string, id: string }
  instructors?: { userId: string, userName?: string }[]
}

/**
 * Who may send an autonomous agent a message. Single source of truth: the message
 * route, the websocket canSubscribe callback (Plan C) and the abort route all call
 * this, so the three cannot drift apart.
 *
 * Admins of the owning account are implicitly allowed — they configure the autonomous
 * agent anyway. Listed instructors are allowed from any account, because the list is
 * a deliberate grant to borrow this autonomous agent's permissions.
 */
export function canInstruct (agent: InstructableAgent, session: InstructSession): boolean {
  if (session.user.adminMode) return true
  const ownsAccount = session.account.type === agent.owner.type && session.account.id === agent.owner.id
  if (ownsAccount && session.accountRole === 'admin') return true
  return (agent.instructors ?? []).some(instructor => instructor.userId === session.user.id)
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test-unit -- tests/features/autonomous-agents/autonomous-agents.unit.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Export the type and wire the collection**

In `api/types/index.ts`:

```ts
import settingsSchema from './settings/schema.js'
import modelSchema from './model/schema.js'
import limitsSchema from './limits/schema.js'
import autonomousAgentSchema from './autonomous-agent/schema.js'

export * from './settings/index.ts'
export type { Limits } from './limits/index.ts'
export type { AutonomousAgent } from './autonomous-agent/index.ts'
export { settingsSchema, modelSchema, limitsSchema, autonomousAgentSchema }
```

(keep the existing `ModelInfo` export below, unchanged)

In `api/src/mongo.ts`, add the import, the accessor and the indexes:

```ts
import type { AutonomousAgent } from '#types/autonomous-agent/index.ts'
```

```ts
  get autonomousAgents () {
    return mongoLib.db.collection<AutonomousAgent>('autonomous-agents')
  }
```

and inside `mongoLib.configure({ ... })`:

```ts
      'autonomous-agents': {
        'main-keys': [{ id: 1 }, { unique: true }],
        'owner-keys': [{ 'owner.type': 1, 'owner.id': 1, updatedAt: -1 }, {}]
      },
```

In `api/src/app.ts`, inside the `NODE_ENV === 'development'` `DELETE /api/test-env` handler, add the new collection to the cleanup list:

```ts
    await mongo.db.collection('autonomous-agents').deleteMany({ 'owner.id': /^test/ })
```

- [ ] **Step 8: Regenerate types and verify**

Run: `npm run build-types && npm run check-types && npm run lint-fix`
Expected: no errors. `api/doc/autonomous-agents/autonomous-agent-write-req/index.ts` now exists with a `returnValid` export, and `ui/src/components/vjsf/vjsf-autonomous-agent-write-req-en.vue` / `-fr.vue` are generated.

Run: `npm run test-unit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add api/types api/doc/autonomous-agents api/src/autonomous-agents api/src/mongo.ts api/src/app.ts tests/features/autonomous-agents ui/src/components/vjsf
git commit -m "feat(autonomous-agents): document schema, storage and instruct authorization"
```

---

### Task 3: Catalog endpoint, create and read routes

**Files:**
- Create: `api/src/autonomous-agents/service.ts`
- Create: `api/src/autonomous-agents/router.ts`
- Create: `tests/features/autonomous-agents/autonomous-agents.api.spec.ts`
- Modify: `api/src/app.ts` (mount the router)
- Modify: `api/config/type/schema.json`, `api/config/default.js`, `api/config/custom-environment-variables.js` (rollout flag)

**Interfaces:**
- Consumes: `listMcpServerCatalog`, `unknownMcpServerIds` (Task 1); `canInstruct`, `mongo.autonomousAgents`, `returnValid` (Task 2).
- Produces:
  - `getAutonomousAgent(owner: AccountKeys, id: string): Promise<AutonomousAgent | null>`
  - `assertWriteAllowed(req): SessionStateAuthenticated` — applies the rollout gate
  - Routes: `GET|POST /api/autonomous-agents/:type/:id`, `GET /api/autonomous-agents/:type/:id/mcp-servers`, `GET /api/autonomous-agents/:type/:id/:agentId`

**Route ordering note:** the literal `mcp-servers` route MUST be registered before the `/:agentId` param route, or Express matches `mcp-servers` as an agent id. `api/src/traces/router.ts` has the same constraint for its `/conversation` route and documents it.

- [ ] **Step 1: Write the failing test**

Create `tests/features/autonomous-agents/autonomous-agents.api.spec.ts`:

```ts
/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'

const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })
const otherOrgAdmin = await axiosAuth('dev1-contrib1', { org: 'dev1' })
const admin = await superAdmin

const validAgent = () => ({
  title: 'Support triage',
  persona: 'You triage incoming support questions.',
  mcpServers: [{ serverId: 'dev-public-mcp' }],
  toolDisclosure: 'static',
  enabled: true
})

test.describe('Autonomous agents API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('the MCP catalog lists the dev servers without credentials', async () => {
    const res = await admin.get('/api/autonomous-agents/organization/test1/mcp-servers')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, res.data.results.length)
    const publicServer = res.data.results.find((s: any) => s.id === 'dev-public-mcp')
    assert.ok(publicServer, 'expected the dev-config public MCP server')
    assert.equal(publicServer.auth, 'none')
    assert.equal(JSON.stringify(res.data).includes('apiKey'), false)
  })

  test('a non-admin member cannot read the MCP catalog', async () => {
    await assert.rejects(orgMember.get('/api/autonomous-agents/organization/test1/mcp-servers'), { status: 403 })
  })

  test('a superadmin creates an autonomous agent and reads it back', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    assert.equal(created.status, 200)
    assert.ok(created.data.id, 'expected a generated id')
    assert.equal(created.data.owner.type, 'organization')
    assert.equal(created.data.owner.id, 'test1')
    assert.ok(created.data.createdAt)

    const read = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}`)
    assert.equal(read.status, 200)
    assert.equal(read.data.title, 'Support triage')
  })

  test('listing returns only the autonomous agents of that account', async () => {
    await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    const res = await admin.get('/api/autonomous-agents/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
    assert.equal(res.data.results[0].title, 'Support triage')
  })

  test('an unknown serverId is refused with 400 naming the id', async () => {
    const body = { ...validAgent(), mcpServers: [{ serverId: 'no-such-server' }] }
    await assert.rejects(
      admin.post('/api/autonomous-agents/organization/test1', body),
      (err: any) => { assert.equal(err.status, 400); assert.match(String(err.data), /no-such-server/); return true }
    )
  })

  test('a body missing persona is refused with 400', async () => {
    const { persona, ...noPersona } = validAgent()
    await assert.rejects(admin.post('/api/autonomous-agents/organization/test1', noPersona), { status: 400 })
  })

  test('the rollout gate refuses an org admin who is not in admin mode', async () => {
    await assert.rejects(orgAdmin.post('/api/autonomous-agents/organization/test1', validAgent()), { status: 403 })
  })

  test('an admin of another account cannot create here', async () => {
    await assert.rejects(otherOrgAdmin.post('/api/autonomous-agents/organization/test1', validAgent()), { status: 403 })
  })

  test('an org admin can READ even while the rollout gate blocks writes', async () => {
    await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    const res = await orgAdmin.get('/api/autonomous-agents/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-api -- tests/features/autonomous-agents/autonomous-agents.api.spec.ts`
Expected: FAIL with 404s — the routes do not exist.

If instead it fails with a connection error, run `bash dev/status.sh`, report the output, and stop.

- [ ] **Step 3: Add the rollout flag to config**

In `api/config/type/schema.json` `properties`, after the `mcpServers` entry:

```json
"autonomousAgentsRequireAdminMode": { "type": "boolean", "default": true }
```

In `api/config/default.js`, after the `mcpServers: [],` line:

```js
  // Progressive exposure: while true, configuring an autonomous agent additionally
  // requires admin mode. This is a rollout control, not an ownership boundary —
  // nothing in the document is durably superadmin-owned, and flipping this to false
  // opens configuration to org admins with no schema change and no migration.
  autonomousAgentsRequireAdminMode: true,
```

In `api/config/custom-environment-variables.js`, after the `mcpServers` line:

```js
  autonomousAgentsRequireAdminMode: { __name: 'AUTONOMOUS_AGENTS_REQUIRE_ADMIN_MODE', __format: 'json' },
```

- [ ] **Step 4: Write the service**

Create `api/src/autonomous-agents/service.ts`:

```ts
/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { type AccountKeys, httpError, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import type { Request } from 'express'
import { listMcpServerCatalog, unknownMcpServerIds } from '../mcp-servers/operations.ts'

export const getMcpServerCatalog = () => listMcpServerCatalog(config.mcpServers ?? [])

export const getAutonomousAgent = async (owner: AccountKeys, id: string) => {
  return await mongo.autonomousAgents.findOne(
    { id, 'owner.type': owner.type, 'owner.id': owner.id },
    { projection: { _id: 0 } }
  )
}

/**
 * Write-side session gate. Account-role authorization is applied by the caller with
 * assertAccountRole; this only adds the progressive-rollout requirement, so that
 * turning the flag off is the single change that opens writes to org admins.
 */
export const reqWriteSession = (req: Request) => {
  return config.autonomousAgentsRequireAdminMode ? reqAdminMode(req) : reqSessionAuthenticated(req)
}

/** 400 naming every unknown server id, rather than storing a reference that can never resolve. */
export const assertKnownMcpServers = (mcpServers?: { serverId: string }[]) => {
  const unknown = unknownMcpServerIds(config.mcpServers ?? [], mcpServers ?? [])
  if (unknown.length) throw httpError(400, `unknown MCP server(s): ${unknown.join(', ')}`)
}
```

- [ ] **Step 5: Write the router**

Create `api/src/autonomous-agents/router.ts`:

```ts
/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { nanoid } from 'nanoid'
import mongo from '#mongo'
import { type AccountKeys, assertAccountRole, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import * as writeReqBody from '#doc/autonomous-agents/autonomous-agent-write-req/index.ts'
import { getAutonomousAgent, getMcpServerCatalog, reqWriteSession, assertKnownMcpServers } from './service.ts'

const router = Router()
export default router

// The literal `mcp-servers` segment MUST stay registered before the `/:agentId`
// param route below, or Express matches it as an autonomous agent id.
// api/src/traces/router.ts has the same constraint for its /conversation route.
router.get('/:type/:id/mcp-servers', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const results = getMcpServerCatalog()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const results = await mongo.autonomousAgents
      .find({ 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.post('/:type/:id', async (req, res, next) => {
  try {
    const session = reqWriteSession(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const body = writeReqBody.returnValid(req.body, { name: 'body' })
    assertKnownMcpServers(body.mcpServers)

    const now = new Date().toISOString()
    const autonomousAgent = {
      ...body,
      id: nanoid(),
      owner,
      createdAt: now,
      updatedAt: now,
      createdBy: { id: session.user.id, name: session.user.name }
    }
    await mongo.autonomousAgents.insertOne({ ...autonomousAgent })

    eventsLog.info('agents.autonomous-agent.create', `autonomous agent ${autonomousAgent.id} created for owner ${owner.type}/${owner.id}`, { req })
    res.json(autonomousAgent)
  } catch (err) { next(err) }
})

router.get('/:type/:id/:agentId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const autonomousAgent = await getAutonomousAgent(owner, req.params.agentId)
    if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')
    res.json(autonomousAgent)
  } catch (err) { next(err) }
})
```

Add `nanoid` to `api/package.json` dependencies if it is not already there:

Run: `node -e "console.log(require('./api/package.json').dependencies.nanoid ?? 'MISSING')"`
If it prints `MISSING`, run: `npm i -w api nanoid`

- [ ] **Step 6: Mount the router**

In `api/src/app.ts`, add the import beside the other routers:

```ts
import autonomousAgentsRouter from './autonomous-agents/router.ts'
```

and the mount, after the `catalog` line:

```ts
app.use('/api/autonomous-agents', autonomousAgentsRouter)
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm run test-api -- tests/features/autonomous-agents/autonomous-agents.api.spec.ts`
Expected: PASS (9 tests).

- [ ] **Step 8: Verify the whole build**

Run: `npm run lint-fix && npm run build-types && npm run check-types`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add api/src/autonomous-agents api/src/app.ts api/config api/package.json package-lock.json tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): MCP catalog endpoint, create and read routes"
```

---

### Task 4: Update and delete routes

**Files:**
- Modify: `api/src/autonomous-agents/router.ts` (add PUT and DELETE)
- Modify: `tests/features/autonomous-agents/autonomous-agents.api.spec.ts` (add cases)

**Interfaces:**
- Consumes: everything from Task 3.
- Produces: `PUT|DELETE /api/autonomous-agents/:type/:id/:agentId`

**Why a whole-document PUT is correct here**, unlike `settings`: `api/src/settings/router.ts` uses targeted `$set`s because two different routes own disjoint halves of one document. An autonomous agent has exactly one owner and one write route, so whole-document replace of the client-writable subset is the simpler correct choice. Server-owned fields (`id`, `owner`, `createdAt`, `createdBy`) are preserved explicitly.

- [ ] **Step 1: Write the failing tests**

Append to `tests/features/autonomous-agents/autonomous-agents.api.spec.ts`, inside the existing `test.describe` block:

```ts
  test('PUT replaces the writable fields and preserves the server-owned ones', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())

    const updated = await admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, {
      ...validAgent(),
      title: 'Renamed',
      instructions: 'Answer in French.',
      instructors: [{ userId: 'test1-user1', userName: 'Test User' }]
    })

    assert.equal(updated.status, 200)
    assert.equal(updated.data.title, 'Renamed')
    assert.equal(updated.data.instructions, 'Answer in French.')
    assert.deepEqual(updated.data.instructors, [{ userId: 'test1-user1', userName: 'Test User' }])
    assert.equal(updated.data.id, created.data.id)
    assert.equal(updated.data.createdAt, created.data.createdAt)
    assert.notEqual(updated.data.updatedAt, created.data.createdAt)
  })

  test('PUT drops a field that is absent from the new body', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', { ...validAgent(), instructions: 'Initial.' })
    const updated = await admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, validAgent())
    assert.equal('instructions' in updated.data, false)
  })

  test('PUT refuses an unknown serverId', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, { ...validAgent(), mcpServers: [{ serverId: 'no-such-server' }] }),
      (err: any) => { assert.equal(err.status, 400); assert.match(String(err.data), /no-such-server/); return true }
    )
  })

  test('PUT on an unknown autonomous agent is a 404', async () => {
    await assert.rejects(
      admin.put('/api/autonomous-agents/organization/test1/no-such-agent', validAgent()),
      { status: 404 }
    )
  })

  test('the rollout gate refuses a PUT from an org admin not in admin mode', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      orgAdmin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, { ...validAgent(), title: 'Nope' }),
      { status: 403 }
    )
  })

  test('DELETE removes it and a second DELETE is a 404', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())

    const deleted = await admin.delete(`/api/autonomous-agents/organization/test1/${created.data.id}`)
    assert.equal(deleted.status, 204)

    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}`),
      { status: 404 }
    )
    await assert.rejects(
      admin.delete(`/api/autonomous-agents/organization/test1/${created.data.id}`),
      { status: 404 }
    )
  })

  test('an autonomous agent of another account cannot be reached by id', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/dev1/${created.data.id}`),
      { status: 404 }
    )
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test-api -- tests/features/autonomous-agents/autonomous-agents.api.spec.ts`
Expected: FAIL — the PUT and DELETE routes return 404 from the catch-all.

- [ ] **Step 3: Add the routes**

Append to `api/src/autonomous-agents/router.ts`:

```ts
router.put('/:type/:id/:agentId', async (req, res, next) => {
  try {
    const session = reqWriteSession(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const body = writeReqBody.returnValid(req.body, { name: 'body' })
    assertKnownMcpServers(body.mcpServers)

    const existing = await getAutonomousAgent(owner, req.params.agentId)
    if (!existing) throw httpError(404, 'unknown autonomous agent')

    // Whole-document replace of the client-writable subset: one owner, one write
    // route, so there is no disjoint half to preserve the way settings has. The
    // server-owned fields are carried over explicitly, and any writable field absent
    // from the body is genuinely dropped.
    const updated = {
      ...body,
      id: existing.id,
      owner: existing.owner,
      createdAt: existing.createdAt,
      ...(existing.createdBy ? { createdBy: existing.createdBy } : {}),
      updatedAt: new Date().toISOString()
    }
    await mongo.autonomousAgents.replaceOne({ id: existing.id, 'owner.type': owner.type, 'owner.id': owner.id }, { ...updated })

    eventsLog.info('agents.autonomous-agent.update', `autonomous agent ${existing.id} updated for owner ${owner.type}/${owner.id}`, { req })
    res.json(updated)
  } catch (err) { next(err) }
})

router.delete('/:type/:id/:agentId', async (req, res, next) => {
  try {
    const session = reqWriteSession(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')

    const result = await mongo.autonomousAgents.deleteOne({ id: req.params.agentId, 'owner.type': owner.type, 'owner.id': owner.id })
    if (!result.deletedCount) throw httpError(404, 'unknown autonomous agent')

    eventsLog.info('agents.autonomous-agent.delete', `autonomous agent ${req.params.agentId} deleted for owner ${owner.type}/${owner.id}`, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test-api -- tests/features/autonomous-agents/autonomous-agents.api.spec.ts`
Expected: PASS (16 tests).

- [ ] **Step 5: Run the full suite**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`
Expected: PASS. No existing spec should have changed behaviour.

- [ ] **Step 6: Commit**

```bash
git add api/src/autonomous-agents/router.ts tests/features/autonomous-agents/autonomous-agents.api.spec.ts
git commit -m "feat(autonomous-agents): update and delete routes"
```

---

## Done when

- `MCP_SERVERS` is validated at boot and exposed, credential-free, at `GET /api/autonomous-agents/:type/:id/mcp-servers`.
- Autonomous agents can be created, listed, read, updated and deleted through account-scoped routes, with account-admin authorization and the progressive-rollout admin-mode gate.
- An autonomous agent cannot reference an MCP server the deployment has not published.
- `npm run lint-fix`, `npm run check-types`, `npm run test-unit`, `npm run test-api` all pass.

## Deviations from the spec

- **Catalog route is account-scoped.** The spec wrote `GET /api/autonomous-agents/mcp-servers`; this plan uses `GET /api/autonomous-agents/:type/:id/mcp-servers`, mirroring `GET /api/catalog/:type/:id`. It gives the endpoint a real authorization subject (`assertAccountRole(session, owner, 'admin')`) instead of leaving it as "any authenticated session", and it lets the vjsf picker interpolate `${context.accountType}/${context.accountId}` exactly as the model picker already does. The spec has been updated to match.
- **The `shared/` extraction moves to Plan C** (spec delivery step 1 → Plan C), because its only new consumer is the runtime.

## Deliberately deferred

- **`shared/` extraction of the loop modules** → Plan C, where the runtime that consumes them lives.
- **UI** (list page, configuration form) → Plan C. The vjsf components are generated by this plan but not yet mounted on a page.
- **NHI enrollment verification** — Plan A stores `nhi.clientId` as an opaque string with no exchange attempt. Plan B adds the real exchange on save, so a misconfiguration surfaces at configuration time.
- **Refusing to run an autonomous agent with no `nhi`** → Plan C's executor.
