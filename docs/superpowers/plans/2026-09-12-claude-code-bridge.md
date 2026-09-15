# Claude Code bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local dev-only HTTP server that lets `data-fair/agents` run on Claude Code subscription models, by presenting the Claude Agent SDK as an OpenAI-compatible provider.

**Architecture:** A standalone `node:http` server in `dev/claude-bridge/`, started by the developer alongside the other dev processes. It answers `GET /v1/models` and `POST /v1/chat/completions`. Tool definitions arriving in a request are republished to the SDK as an in-process MCP server whose handlers *suspend*; the bridge returns the resulting `tool_calls` over SSE, closes the response, and keeps the SDK query alive until the next request delivers the tool results. That keeps one `claude` session per conversation, which is what makes prompt caching work. No file under `api/`, `ui/`, `lib-vue/` or `lib-vuetify/` is modified.

**Tech Stack:** Node 24 (native TypeScript stripping — `.ts` runs directly, no build step), `node:http`, `@anthropic-ai/claude-agent-sdk`, `@modelcontextprotocol/sdk`, Playwright `unit` project for tests, neostandard/eslint.

**Spec:** `docs/superpowers/specs/2026-09-12-claude-code-bridge-and-simulation-harness-design.md`

## Global Constraints

- **Isolation is non-negotiable and not caller-overridable.** Every SDK query must be created with `settingSources: []`, `tools: []`, `strictMcpConfig: true`, a freshly-created neutral temp cwd, and an env with every `CLAUDE_CODE_*` variable removed. Spec §1.2: with `settingSources: []` but the repo as cwd, the model recited the project's auto-memory index. Only the neutral cwd removes it.
- **The MCP server name is `bridge`.** Tools therefore reach the model as `mcp__bridge__<name>` and must be mapped back before being emitted as OpenAI `tool_calls`.
- **Dev-only.** Nothing in this plan may be imported from `api/`, `ui/`, `lib-vue/` or `lib-vuetify/`. Dependencies go in **root `devDependencies`**; `Dockerfile:40` runs `npm ci --omit=dev`, so they never ship.
- **Code style:** neostandard — no semicolons, single quotes, 2-space indent. Run `npm run lint-fix` before every commit.
- **Node runs `.ts` directly.** No compile step, no `tsc` build output. Imports of local files must carry the `.ts` extension (`allowImportingTsExtensions` is on).
- **Test style:** `import { test } from 'playwright/test'` + `import assert from 'node:assert/strict'`, matching `tests/features/settings/settings.unit.spec.ts`. Unit tests must not hit the network or spawn `claude`.
- **Port:** `BRIDGE_PORT`, default `3194` (free — `.env` allocates 3183-3188, 3193, 3203-3205).

## File Structure

| File | Responsibility |
|---|---|
| `dev/claude-bridge/isolation.ts` | Build the SDK option block that guarantees the Global Constraint above. Nothing else. |
| `dev/claude-bridge/openai.ts` | Pure OpenAI⇄SDK translation: types, system-prompt extraction, transcript rendering, tool-name mapping, SSE chunk and error bodies, usage mapping. No I/O. |
| `dev/claude-bridge/tool-server.ts` | Build the per-request in-process MCP server from OpenAI tool definitions, with suspending handlers. |
| `dev/claude-bridge/sessions.ts` | The live-session store: continuation detection, hashing, TTL/LRU lifecycle. No SDK import. |
| `dev/claude-bridge/server.ts` | HTTP layer: routes, SSE writing, wiring the above to `query()`. |
| `dev/claude-bridge/index.ts` | Entry point: read config from env, start the server, log. |
| `tests/features/claude-bridge/isolation.unit.spec.ts` | Task 2 tests |
| `tests/features/claude-bridge/openai-mapping.unit.spec.ts` | Task 3 tests |
| `tests/features/claude-bridge/tool-server.unit.spec.ts` | Task 4 tests |
| `tests/features/claude-bridge/sessions.unit.spec.ts` | Task 5 tests |

Split by responsibility: `openai.ts` and `sessions.ts` are pure and carry the bulk of the tests; `server.ts` is the only file that performs I/O, so it stays thin.

---

### Task 1: Project scaffolding, dependencies, and `GET /v1/models`

Delivers a runnable server whose model list populates the provider dropdown in the agents settings UI. Everything else builds on this.

**Files:**
- Modify: `package.json` (devDependencies + `dev-bridge` script)
- Modify: `eslint.config.mjs:5` (un-ignore the bridge directory)
- Create: `dev/claude-bridge/index.ts`
- Create: `dev/claude-bridge/server.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `createServer (opts: { port: number }): import('node:http').Server` from `server.ts`; constant `MODELS` (array of `{ id: string, name: string }`).

- [ ] **Step 1: Install the two SDKs as root devDependencies**

```bash
npm i -D @anthropic-ai/claude-agent-sdk@^0.3.269 @modelcontextprotocol/sdk@^1.0.0
```

Verify they landed in `devDependencies`, not `dependencies`:

```bash
node -e "const p=require('./package.json');console.log(!!p.devDependencies['@anthropic-ai/claude-agent-sdk'], !!p.devDependencies['@modelcontextprotocol/sdk'], !p.dependencies['@anthropic-ai/claude-agent-sdk'])"
```

Expected: `true true true`

- [ ] **Step 2: Un-ignore the bridge directory for eslint**

`eslint.config.mjs` ignores `dev/*`, and that prunes subdirectories — verified: a file at `dev/claude-bridge/t.ts` reports *"File ignored because of a matching ignore pattern"*. Add two negations so only the bridge is linted, leaving the rest of `dev/` ignored as before.

In `eslint.config.mjs:5`, change:

```js
  { ignores: ['ui/*', '**/.type/', 'dev/*', 'node_modules/*', 'lib-vue/*.js', 'lib-vue/*.d.ts', 'lib-vuetify/*.js', 'lib-vuetify/*.d.ts'] },
```

to:

```js
  { ignores: ['ui/*', '**/.type/', 'dev/*', '!dev/claude-bridge', '!dev/claude-bridge/**', 'node_modules/*', 'lib-vue/*.js', 'lib-vue/*.d.ts', 'lib-vuetify/*.js', 'lib-vuetify/*.d.ts'] },
```

Note: `tsconfig.json` needs no change. It excludes `dev`, but TypeScript still pulls these files into the program when the test files import them, so `npm run check-types` covers them — verified by deliberately introducing a type error and seeing `tsc` report it.

- [ ] **Step 3: Write the server with the models route**

Create `dev/claude-bridge/server.ts`:

```ts
/**
 * HTTP layer for the Claude Code bridge. Dev-only: presents the Claude Agent SDK
 * as an OpenAI-compatible provider so the dev workspace can run on subscription
 * models. Never imported by api/, ui/ or the published libs.
 */
import http from 'node:http'

// The settings UI populates its dropdown from GET {baseURL}/models
// (api/src/models/router.ts fetchOpenAICompatibleModels). A fixed list avoids a
// network round trip; ids are what get passed back as the `model` field.
export const MODELS = [
  { id: 'opus', name: 'Claude Opus (Claude Code default alias)' },
  { id: 'sonnet', name: 'Claude Sonnet (Claude Code default alias)' },
  { id: 'haiku', name: 'Claude Haiku (Claude Code default alias)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' }
]

export function createServer (opts: { port: number }) {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') {
      const body = JSON.stringify({ object: 'list', data: MODELS })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(body)
      return
    }
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: { message: 'not found', type: 'invalid_request_error' } }))
  })
  server.listen(opts.port)
  return server
}
```

Create `dev/claude-bridge/index.ts`:

```ts
import { createServer } from './server.ts'

const port = Number(process.env.BRIDGE_PORT ?? 3194)
createServer({ port })
console.log(`claude-bridge listening on http://localhost:${port}`)
console.log('configure an "OpenAI Compatible" provider with this base URL + /v1 and Compatibility Mode = compatible')
```

- [ ] **Step 4: Add the npm script**

In root `package.json` `scripts`, after the `dev-ui` line, add:

```json
    "dev-bridge": "mkdir -p dev/logs && node dev/claude-bridge/index.ts 2>&1 | tee dev/logs/dev-bridge.log",
```

This mirrors the `dev-api` script's logging convention so `dev/logs/` stays the single place to look.

- [ ] **Step 5: Verify it runs and serves the model list**

```bash
npm run dev-bridge &
sleep 2
curl -s http://localhost:3194/v1/models | head -c 200
kill %1
```

Expected: JSON beginning `{"object":"list","data":[{"id":"opus"...`

- [ ] **Step 6: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add package.json package-lock.json eslint.config.mjs dev/claude-bridge/
git commit -m "feat(dev): claude-code bridge skeleton with model listing"
```

---

### Task 2: The isolation invariant

The single most important module. Spec §1.2 measured the failure it prevents: with the repo as cwd the assistant recited the auto-memory index, naming the very bugs the tooling exists to find.

**Files:**
- Create: `dev/claude-bridge/isolation.ts`
- Test: `tests/features/claude-bridge/isolation.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `createNeutralCwd (): string`
  - `scrubEnv (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv`
  - `isolationOptions (cwd: string, env?: NodeJS.ProcessEnv): { cwd: string, env: NodeJS.ProcessEnv, settingSources: never[], tools: never[], strictMcpConfig: true }`

- [ ] **Step 1: Write the failing test**

Create `tests/features/claude-bridge/isolation.unit.spec.ts`:

```ts
/**
 * stateless unit tests for the claude-bridge isolation invariant (spec §1.2)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import os from 'node:os'
import { createNeutralCwd, scrubEnv, isolationOptions } from '../../../dev/claude-bridge/isolation.ts'

test.describe('claude-bridge isolation', () => {
  test('the neutral cwd is a fresh temp dir, not the repo', () => {
    const cwd = createNeutralCwd()
    assert.ok(cwd.startsWith(os.tmpdir()), `${cwd} should be under ${os.tmpdir()}`)
    assert.ok(!cwd.includes('data-fair'), 'cwd must not leak a project name')
    assert.notEqual(cwd, createNeutralCwd())
  })

  test('scrubEnv removes every CLAUDE_CODE_ variable and keeps the rest', () => {
    const scrubbed = scrubEnv({ PATH: '/usr/bin', HOME: '/home/x', CLAUDE_CODE_SESSION_ID: 'abc', CLAUDE_CODE_ENTRYPOINT: 'cli' })
    assert.equal(scrubbed.PATH, '/usr/bin')
    assert.equal(scrubbed.HOME, '/home/x')
    assert.deepEqual(Object.keys(scrubbed).filter(k => k.startsWith('CLAUDE_CODE_')), [])
  })

  test('isolationOptions pins every setting the guarantee depends on', () => {
    const opts = isolationOptions('/tmp/neutral', { CLAUDE_CODE_SESSION_ID: 'abc' })
    assert.deepEqual(opts.settingSources, [])
    assert.deepEqual(opts.tools, [])
    assert.equal(opts.strictMcpConfig, true)
    assert.equal(opts.cwd, '/tmp/neutral')
    assert.equal(opts.env.CLAUDE_CODE_SESSION_ID, undefined)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/claude-bridge/isolation.unit.spec.ts`
Expected: FAIL — cannot find module `dev/claude-bridge/isolation.ts`

- [ ] **Step 3: Implement**

Create `dev/claude-bridge/isolation.ts`:

```ts
/**
 * The isolation guarantee (spec §1.2).
 *
 * Measured, not assumed: with `settingSources: []` but the repository as cwd, the
 * model answered with the project's auto-memory index — naming the bugs this
 * tooling exists to find. Auto-memory is keyed to the project directory, so only
 * a neutral cwd removes it. `tools: []` matters just as much: without it the SDK
 * offers 27 built-in tools and the model reaches for ToolSearch instead of the
 * tools the request actually declared.
 *
 * These options are fixed. Nothing in a request may override them.
 */
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

export function createNeutralCwd (): string {
  // Deliberately meaningless name: ~367 tokens of SDK preamble are irreducible and
  // include the cwd path, so the path itself must carry no signal about the product.
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-'))
}

export function scrubEnv (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const scrubbed: NodeJS.ProcessEnv = { ...env }
  for (const key of Object.keys(scrubbed)) {
    if (key.startsWith('CLAUDE_CODE_')) delete scrubbed[key]
  }
  return scrubbed
}

export function isolationOptions (cwd: string, env: NodeJS.ProcessEnv = process.env) {
  return {
    cwd,
    env: scrubEnv(env),
    settingSources: [] as never[],
    tools: [] as never[],
    strictMcpConfig: true as const
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm run test-unit tests/features/claude-bridge/isolation.unit.spec.ts`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add dev/claude-bridge/isolation.ts tests/features/claude-bridge/isolation.unit.spec.ts
git commit -m "feat(dev): pin the claude-bridge isolation invariant"
```

---

### Task 3: OpenAI translation (pure)

**Files:**
- Create: `dev/claude-bridge/openai.ts`
- Test: `tests/features/claude-bridge/openai-mapping.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - types `OpenAIToolCall`, `OpenAIMessage`, `OpenAIToolDef`
  - `MCP_SERVER_NAME = 'bridge'`
  - `toolNameToMcp (name: string): string`
  - `mcpNameToTool (name: string): string`
  - `extractSystemPrompt (messages: OpenAIMessage[]): string`
  - `renderTranscript (messages: OpenAIMessage[]): string`
  - `textChunk (id: string, model: string, text: string): object`
  - `toolCallsChunk (id: string, model: string, calls: OpenAIToolCall[]): object`
  - `finalChunk (id: string, model: string, finishReason: 'stop' | 'tool_calls', usage?: object): object`
  - `mapUsage (usage: { input_tokens?: number, output_tokens?: number } | undefined): object | undefined`
  - `errorBody (message: string, type?: string): object`

- [ ] **Step 1: Write the failing test**

Create `tests/features/claude-bridge/openai-mapping.unit.spec.ts`:

```ts
/**
 * stateless unit tests for the claude-bridge OpenAI translation layer
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  toolNameToMcp, mcpNameToTool, extractSystemPrompt, renderTranscript,
  textChunk, toolCallsChunk, finalChunk, mapUsage, errorBody
} from '../../../dev/claude-bridge/openai.ts'
import type { OpenAIMessage } from '../../../dev/claude-bridge/openai.ts'

test.describe('tool name mapping', () => {
  test('round-trips through the mcp prefix', () => {
    assert.equal(toolNameToMcp('search_data'), 'mcp__bridge__search_data')
    assert.equal(mcpNameToTool('mcp__bridge__search_data'), 'search_data')
  })

  test('leaves an unprefixed name untouched', () => {
    assert.equal(mcpNameToTool('search_data'), 'search_data')
  })

  test('keeps underscores in the original name intact', () => {
    assert.equal(mcpNameToTool(toolNameToMcp('get_dataset_schema')), 'get_dataset_schema')
  })
})

test.describe('system prompt extraction', () => {
  test('joins every system message in order', () => {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: 'You are an assistant.' },
      { role: 'system', content: 'Answer in French.' },
      { role: 'user', content: 'hello' }
    ]
    assert.equal(extractSystemPrompt(messages), 'You are an assistant.\n\nAnswer in French.')
  })

  test('returns an empty string when there is no system message', () => {
    assert.equal(extractSystemPrompt([{ role: 'user', content: 'hello' }]), '')
  })
})

test.describe('transcript rendering', () => {
  test('omits system messages, which travel as the system prompt', () => {
    const out = renderTranscript([
      { role: 'system', content: 'be brief' },
      { role: 'user', content: 'hello' }
    ])
    assert.ok(!out.includes('be brief'))
    assert.ok(out.includes('hello'))
  })

  test('renders tool calls and their results so the model can follow them', () => {
    const messages: OpenAIMessage[] = [
      { role: 'user', content: 'weather in Paris?' },
      { role: 'assistant', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Paris"}' } }] },
      { role: 'tool', tool_call_id: 'call_1', content: '{"temp":17}' }
    ]
    const out = renderTranscript(messages)
    assert.ok(out.includes('get_weather'))
    assert.ok(out.includes('{"city":"Paris"}'))
    assert.ok(out.includes('call_1'))
    assert.ok(out.includes('{"temp":17}'))
  })
})

test.describe('SSE chunks', () => {
  test('a text chunk carries the delta and no finish reason', () => {
    const c = textChunk('id1', 'haiku', 'hi') as any
    assert.equal(c.object, 'chat.completion.chunk')
    assert.equal(c.id, 'id1')
    assert.equal(c.model, 'haiku')
    assert.equal(c.choices[0].delta.content, 'hi')
    assert.equal(c.choices[0].finish_reason, null)
  })

  test('a tool-calls chunk indexes each call', () => {
    const c = toolCallsChunk('id1', 'haiku', [
      { id: 'call_1', type: 'function', function: { name: 'a', arguments: '{}' } },
      { id: 'call_2', type: 'function', function: { name: 'b', arguments: '{}' } }
    ]) as any
    assert.equal(c.choices[0].delta.tool_calls[0].index, 0)
    assert.equal(c.choices[0].delta.tool_calls[1].index, 1)
    assert.equal(c.choices[0].delta.tool_calls[1].function.name, 'b')
  })

  test('the final chunk carries the finish reason', () => {
    const c = finalChunk('id1', 'haiku', 'tool_calls') as any
    assert.equal(c.choices[0].finish_reason, 'tool_calls')
    assert.deepEqual(c.choices[0].delta, {})
  })
})

test.describe('usage and errors', () => {
  test('maps SDK usage onto the OpenAI shape', () => {
    assert.deepEqual(mapUsage({ input_tokens: 10, output_tokens: 4 }), {
      prompt_tokens: 10, completion_tokens: 4, total_tokens: 14
    })
  })

  test('returns undefined when the SDK reported no usage', () => {
    assert.equal(mapUsage(undefined), undefined)
  })

  test('error bodies use the OpenAI error envelope', () => {
    const e = errorBody('rate limited', 'rate_limit_error') as any
    assert.equal(e.error.message, 'rate limited')
    assert.equal(e.error.type, 'rate_limit_error')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/claude-bridge/openai-mapping.unit.spec.ts`
Expected: FAIL — cannot find module `dev/claude-bridge/openai.ts`

- [ ] **Step 3: Implement**

Create `dev/claude-bridge/openai.ts`:

```ts
/**
 * Pure translation between the OpenAI chat-completions wire format the agents
 * gateway speaks and what the Claude Agent SDK accepts. No I/O, no SDK import —
 * everything here is unit-tested.
 */

export type OpenAIToolCall = {
  id: string
  type: 'function'
  function: { name: string, arguments: string }
}

export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
}

export type OpenAIToolDef = {
  type: 'function'
  function: { name: string, description?: string, parameters?: Record<string, unknown> }
}

// Tools reach the model namespaced by their MCP server, so every name makes a
// round trip through this prefix and must be mapped back before it is emitted.
export const MCP_SERVER_NAME = 'bridge'
const PREFIX = `mcp__${MCP_SERVER_NAME}__`

export function toolNameToMcp (name: string): string {
  return PREFIX + name
}

export function mcpNameToTool (name: string): string {
  return name.startsWith(PREFIX) ? name.slice(PREFIX.length) : name
}

export function extractSystemPrompt (messages: OpenAIMessage[]): string {
  return messages
    .filter(m => m.role === 'system')
    .map(m => m.content ?? '')
    .join('\n\n')
}

/**
 * Render the conversation as a single prompt, for the replay path (a fresh
 * session). The continuation path never comes through here — it delivers tool
 * results into a query that is already holding the history.
 */
export function renderTranscript (messages: OpenAIMessage[]): string {
  const lines: string[] = ['<conversation_history>']
  for (const m of messages) {
    if (m.role === 'system') continue
    if (m.role === 'tool') {
      lines.push(`tool result (id=${m.tool_call_id}): ${m.content ?? ''}`)
      continue
    }
    if (m.role === 'assistant' && m.tool_calls?.length) {
      for (const c of m.tool_calls) {
        lines.push(`assistant called tool (id=${c.id}) ${c.function.name} with ${c.function.arguments}`)
      }
      if (m.content) lines.push(`assistant: ${m.content}`)
      continue
    }
    lines.push(`${m.role}: ${m.content ?? ''}`)
  }
  lines.push('</conversation_history>')
  lines.push('')
  lines.push('Continue this conversation: produce the next assistant turn.')
  return lines.join('\n')
}

const base = (id: string, model: string) => ({
  id,
  object: 'chat.completion.chunk',
  created: Math.floor(Date.now() / 1000),
  model
})

export function textChunk (id: string, model: string, text: string) {
  return { ...base(id, model), choices: [{ index: 0, delta: { content: text }, finish_reason: null }] }
}

export function toolCallsChunk (id: string, model: string, calls: OpenAIToolCall[]) {
  return {
    ...base(id, model),
    choices: [{
      index: 0,
      delta: { tool_calls: calls.map((c, index) => ({ index, id: c.id, type: 'function', function: c.function })) },
      finish_reason: null
    }]
  }
}

export function finalChunk (id: string, model: string, finishReason: 'stop' | 'tool_calls', usage?: object) {
  return {
    ...base(id, model),
    choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
    ...(usage ? { usage } : {})
  }
}

/**
 * The SDK also reports total_cost_usd, deliberately not forwarded: it is list-price
 * bookkeeping, while consumption is actually against the plan's rate limits. Showing
 * it in the usage UI would invite reading it as real spend.
 */
export function mapUsage (usage: { input_tokens?: number, output_tokens?: number } | undefined) {
  if (!usage) return undefined
  const prompt = usage.input_tokens ?? 0
  const completion = usage.output_tokens ?? 0
  return { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion }
}

export function errorBody (message: string, type = 'api_error') {
  return { error: { message, type } }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm run test-unit tests/features/claude-bridge/openai-mapping.unit.spec.ts`
Expected: 13 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add dev/claude-bridge/openai.ts tests/features/claude-bridge/openai-mapping.unit.spec.ts
git commit -m "feat(dev): openai translation layer for the claude-bridge"
```

---

### Task 4: The suspending tool server

**Files:**
- Create: `dev/claude-bridge/tool-server.ts`
- Test: `tests/features/claude-bridge/tool-server.unit.spec.ts`

**Interfaces:**
- Consumes: `OpenAIToolDef`, `MCP_SERVER_NAME` from `openai.ts`.
- Produces:
  - `TOOL_TIMEOUT_MS = 600000`
  - `createToolServer (tools: OpenAIToolDef[], onCall: (name: string, args: Record<string, unknown>) => Promise<string>): { type: 'sdk', name: string, instance: unknown, alwaysLoad: true, timeout: number }`
  - `listToolsFor (tools: OpenAIToolDef[]): Array<{ name: string, description: string, inputSchema: Record<string, unknown> }>`

`listToolsFor` is exported separately so the schema translation can be tested without standing up an MCP transport.

- [ ] **Step 1: Write the failing test**

Create `tests/features/claude-bridge/tool-server.unit.spec.ts`:

```ts
/**
 * stateless unit tests for the claude-bridge MCP tool server
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { listToolsFor, createToolServer, TOOL_TIMEOUT_MS } from '../../../dev/claude-bridge/tool-server.ts'
import type { OpenAIToolDef } from '../../../dev/claude-bridge/openai.ts'

const TOOLS: OpenAIToolDef[] = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the weather',
    parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] }
  }
}]

test.describe('tool listing', () => {
  test('passes the JSON Schema through verbatim', () => {
    const listed = listToolsFor(TOOLS)
    assert.equal(listed.length, 1)
    assert.equal(listed[0].name, 'get_weather')
    assert.equal(listed[0].description, 'Get the weather')
    assert.deepEqual(listed[0].inputSchema, TOOLS[0].function.parameters)
  })

  test('supplies an empty object schema when a tool declares no parameters', () => {
    const listed = listToolsFor([{ type: 'function', function: { name: 'ping' } }])
    assert.deepEqual(listed[0].inputSchema, { type: 'object', properties: {} })
  })

  test('tolerates a missing description', () => {
    const listed = listToolsFor([{ type: 'function', function: { name: 'ping' } }])
    assert.equal(typeof listed[0].description, 'string')
  })
})

test.describe('tool server config', () => {
  test('is an sdk server that always loads, with a long timeout', () => {
    const cfg = createToolServer(TOOLS, async () => 'ok')
    assert.equal(cfg.type, 'sdk')
    assert.equal(cfg.name, 'bridge')
    assert.equal(cfg.alwaysLoad, true)
    assert.equal(cfg.timeout, TOOL_TIMEOUT_MS)
    assert.ok(cfg.instance)
  })

  test('the timeout is long enough for a human-driven tool call', () => {
    assert.ok(TOOL_TIMEOUT_MS >= 600000, 'a suspended handler must outlive a slow client turn')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/claude-bridge/tool-server.unit.spec.ts`
Expected: FAIL — cannot find module `dev/claude-bridge/tool-server.ts`

- [ ] **Step 3: Implement**

Create `dev/claude-bridge/tool-server.ts`:

```ts
/**
 * Republishes the tool definitions from an OpenAI request as an in-process MCP
 * server the SDK can offer to the model.
 *
 * Two non-obvious choices:
 *  - the LOW-LEVEL `Server` is used, not the `McpServer` helper: the helper rejects
 *    raw JSON Schema and demands Zod, while a request hands us JSON Schema already.
 *  - handlers SUSPEND. `onCall` returns a promise the HTTP layer resolves when the
 *    client's next request delivers the tool result, so the same query — and its
 *    prompt cache — carries the whole conversation, and the model's tool_use is
 *    answered by a real tool_result rather than by user text.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { MCP_SERVER_NAME, type OpenAIToolDef } from './openai.ts'

// A suspended handler must outlive a slow client turn — a tool wired to a human
// action button can wait minutes. The default MCP timeout would abort it.
export const TOOL_TIMEOUT_MS = 600000

export function listToolsFor (tools: OpenAIToolDef[]) {
  return tools.map(t => ({
    name: t.function.name,
    description: t.function.description ?? '',
    inputSchema: t.function.parameters ?? { type: 'object', properties: {} }
  }))
}

export function createToolServer (
  tools: OpenAIToolDef[],
  onCall: (name: string, args: Record<string, unknown>) => Promise<string>
) {
  const instance = new Server({ name: MCP_SERVER_NAME, version: '1.0.0' }, { capabilities: { tools: {} } })
  instance.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listToolsFor(tools) }))
  instance.setRequestHandler(CallToolRequestSchema, async (req) => {
    const text = await onCall(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>)
    return { content: [{ type: 'text', text }] }
  })
  return {
    type: 'sdk' as const,
    name: MCP_SERVER_NAME,
    instance,
    alwaysLoad: true as const,
    timeout: TOOL_TIMEOUT_MS
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm run test-unit tests/features/claude-bridge/tool-server.unit.spec.ts`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add dev/claude-bridge/tool-server.ts tests/features/claude-bridge/tool-server.unit.spec.ts
git commit -m "feat(dev): suspending mcp tool server for the claude-bridge"
```

---

### Task 5: The live-session store

Spec §2.4. The staleness claim is the one worth testing hardest: its failure mode is a silently wrong answer, not an error.

**Files:**
- Create: `dev/claude-bridge/sessions.ts`
- Test: `tests/features/claude-bridge/sessions.unit.spec.ts`

**Interfaces:**
- Consumes: `OpenAIMessage` from `openai.ts`.
- Produces:
  - `hashMessages (messages: OpenAIMessage[]): string`
  - `continuationOf (messages: OpenAIMessage[]): { key: string, toolResults: Array<{ id: string, content: string }> } | null`
  - `type LiveSession = { key: string, pending: Map<string, (result: string) => void>, abort: () => void, lastSeen: number }`
  - `class SessionStore { constructor (opts?: { ttlMs?: number, max?: number }); get (key: string, now?: number): LiveSession | undefined; set (session: LiveSession): void; delete (key: string): void; rekey (oldKey: string, newKey: string): void; sweep (now?: number): void; get size (): number }`

`rekey` exists because `delete` aborts the live query — re-filing a surviving session
under its new history hash must not go through it.

- [ ] **Step 1: Write the failing test**

Create `tests/features/claude-bridge/sessions.unit.spec.ts`:

```ts
/**
 * stateless unit tests for claude-bridge session continuity (spec §2.4).
 * The staleness guarantee lives here: any edit to history must become a cache
 * MISS, never a wrong answer from a superseded session.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { hashMessages, continuationOf, SessionStore, type LiveSession } from '../../../dev/claude-bridge/sessions.ts'
import type { OpenAIMessage } from '../../../dev/claude-bridge/openai.ts'

const opening: OpenAIMessage[] = [
  { role: 'system', content: 'be brief' },
  { role: 'user', content: 'weather in Paris?' }
]
const withCall: OpenAIMessage[] = [
  ...opening,
  { role: 'assistant', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Paris"}' } }] },
  { role: 'tool', tool_call_id: 'call_1', content: '{"temp":17}' }
]

test.describe('hashing', () => {
  test('is stable for identical histories', () => {
    assert.equal(hashMessages(opening), hashMessages([...opening]))
  })

  test('changes when any message changes', () => {
    const edited: OpenAIMessage[] = [{ role: 'system', content: 'be brief' }, { role: 'user', content: 'weather in Lyon?' }]
    assert.notEqual(hashMessages(opening), hashMessages(edited))
  })
})

test.describe('continuation detection', () => {
  test('recognises assistant tool_calls answered by tool messages', () => {
    const c = continuationOf(withCall)
    assert.ok(c)
    assert.equal(c.key, hashMessages(opening))
    assert.deepEqual(c.toolResults, [{ id: 'call_1', content: '{"temp":17}' }])
  })

  test('handles parallel tool calls', () => {
    const parallel: OpenAIMessage[] = [
      ...opening,
      {
        role: 'assistant',
        tool_calls: [
          { id: 'call_1', type: 'function', function: { name: 'a', arguments: '{}' } },
          { id: 'call_2', type: 'function', function: { name: 'b', arguments: '{}' } }
        ]
      },
      { role: 'tool', tool_call_id: 'call_1', content: 'r1' },
      { role: 'tool', tool_call_id: 'call_2', content: 'r2' }
    ]
    const c = continuationOf(parallel)
    assert.ok(c)
    assert.equal(c.toolResults.length, 2)
    assert.equal(c.key, hashMessages(opening))
  })

  test('a plain new user message is not a continuation', () => {
    assert.equal(continuationOf([...opening, { role: 'assistant', content: 'it rains' }, { role: 'user', content: 'and tomorrow?' }]), null)
  })

  test('an unanswered tool call is not a continuation', () => {
    assert.equal(continuationOf(withCall.slice(0, 3)), null)
  })

  test('an edited earlier turn yields a different key, so it misses', () => {
    const edited = [{ role: 'system', content: 'be VERY brief' }, ...withCall.slice(1)] as OpenAIMessage[]
    const c = continuationOf(edited)
    assert.ok(c)
    assert.notEqual(c.key, hashMessages(opening))
  })
})

test.describe('session store lifecycle', () => {
  const make = (key: string, aborted: string[] = []): LiveSession =>
    ({ key, pending: new Map(), abort: () => aborted.push(key), lastSeen: 0 })

  test('stores and retrieves by key', () => {
    const store = new SessionStore()
    store.set(make('a'))
    assert.equal(store.get('a')?.key, 'a')
    assert.equal(store.get('missing'), undefined)
  })

  test('expired entries are swept and aborted', () => {
    const aborted: string[] = []
    const store = new SessionStore({ ttlMs: 1000 })
    const s = make('a', aborted)
    s.lastSeen = 0
    store.set(s)
    store.sweep(5000)
    assert.equal(store.get('a'), undefined)
    assert.deepEqual(aborted, ['a'])
  })

  test('evicts least-recently-used past the cap, aborting the evicted query', () => {
    const aborted: string[] = []
    const store = new SessionStore({ max: 2 })
    const a = make('a', aborted); a.lastSeen = 1
    const b = make('b', aborted); b.lastSeen = 2
    const c = make('c', aborted); c.lastSeen = 3
    store.set(a); store.set(b); store.set(c)
    assert.equal(store.size, 2)
    assert.equal(store.get('a'), undefined)
    assert.deepEqual(aborted, ['a'])
  })

  test('delete aborts the live query', () => {
    const aborted: string[] = []
    const store = new SessionStore()
    store.set(make('a', aborted))
    store.delete('a')
    assert.deepEqual(aborted, ['a'])
    assert.equal(store.size, 0)
  })

  test('rekey re-files a surviving session WITHOUT aborting it', () => {
    const aborted: string[] = []
    const store = new SessionStore()
    store.set(make('old', aborted))
    store.rekey('old', 'new')
    assert.deepEqual(aborted, [], 'a continuing session must not be aborted')
    assert.equal(store.get('old'), undefined)
    assert.equal(store.get('new')?.key, 'new')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/claude-bridge/sessions.unit.spec.ts`
Expected: FAIL — cannot find module `dev/claude-bridge/sessions.ts`

- [ ] **Step 3: Implement**

Create `dev/claude-bridge/sessions.ts`:

```ts
/**
 * Live session continuity (spec §2.4).
 *
 * The bridge keeps one SDK query alive per conversation so the prompt cache
 * carries across turns. Correctness rests on one property: the key is a content
 * hash of the exact history prefix, so ANY change upstream — compaction replacing
 * turns with a summary, media tool results being redacted, a user retrying —
 * produces a different key and therefore a MISS, which degrades to a full replay.
 * There is no path by which a superseded history is silently answered.
 */
import crypto from 'node:crypto'
import type { OpenAIMessage } from './openai.ts'

export type LiveSession = {
  key: string
  pending: Map<string, (result: string) => void>
  abort: () => void
  lastSeen: number
}

export function hashMessages (messages: OpenAIMessage[]): string {
  return crypto.createHash('sha256').update(JSON.stringify(messages)).digest('hex')
}

/**
 * A continuation request has exactly one shape: an assistant message carrying
 * tool_calls, followed by the tool messages answering every one of them. Strip
 * that suffix and you have the array the bridge saw when it suspended.
 * Anything else is not a continuation.
 */
export function continuationOf (messages: OpenAIMessage[]) {
  let i = messages.length
  const results: Array<{ id: string, content: string }> = []
  while (i > 0 && messages[i - 1].role === 'tool') {
    i--
    results.unshift({ id: messages[i].tool_call_id ?? '', content: messages[i].content ?? '' })
  }
  if (results.length === 0) return null

  const assistant = messages[i - 1]
  if (!assistant || assistant.role !== 'assistant' || !assistant.tool_calls?.length) return null

  // Every call must be answered; a partial answer is not a continuation.
  const answered = new Set(results.map(r => r.id))
  if (assistant.tool_calls.some(c => !answered.has(c.id))) return null

  return { key: hashMessages(messages.slice(0, i - 1)), toolResults: results }
}

export class SessionStore {
  #sessions = new Map<string, LiveSession>()
  #ttlMs: number
  #max: number

  constructor (opts: { ttlMs?: number, max?: number } = {}) {
    this.#ttlMs = opts.ttlMs ?? 15 * 60 * 1000
    this.#max = opts.max ?? 20
  }

  get size () { return this.#sessions.size }

  get (key: string, now = Date.now()): LiveSession | undefined {
    const s = this.#sessions.get(key)
    if (!s) return undefined
    if (now - s.lastSeen > this.#ttlMs) { this.delete(key); return undefined }
    return s
  }

  set (session: LiveSession): void {
    this.#sessions.set(session.key, session)
    while (this.#sessions.size > this.#max) {
      let oldest: LiveSession | undefined
      for (const s of this.#sessions.values()) {
        if (!oldest || s.lastSeen < oldest.lastSeen) oldest = s
      }
      if (!oldest) break
      this.delete(oldest.key)
    }
  }

  delete (key: string): void {
    const s = this.#sessions.get(key)
    if (!s) return
    this.#sessions.delete(key)
    s.abort()
  }

  /**
   * Move a still-running session to the key its grown history now hashes to.
   * Deliberately not `delete` + `set`: delete aborts the query.
   */
  rekey (oldKey: string, newKey: string): void {
    const s = this.#sessions.get(oldKey)
    if (!s) return
    this.#sessions.delete(oldKey)
    s.key = newKey
    this.#sessions.set(newKey, s)
  }

  sweep (now = Date.now()): void {
    for (const [key, s] of [...this.#sessions]) {
      if (now - s.lastSeen > this.#ttlMs) this.delete(key)
    }
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm run test-unit tests/features/claude-bridge/sessions.unit.spec.ts`
Expected: 12 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add dev/claude-bridge/sessions.ts tests/features/claude-bridge/sessions.unit.spec.ts
git commit -m "feat(dev): live session continuity for the claude-bridge"
```

---

### Task 6: Wire up `POST /v1/chat/completions`

> **Corrected during execution.** The design first drafted here deadlocked, and the
> correction is the substance of this task — see `dev/claude-bridge/conversation.ts`
> for the implementation and `tests/features/claude-bridge/conversation.unit.spec.ts`
> for the regression test.
>
> **The hazard.** The SDK yields the assistant message and *then* invokes the MCP tool
> handler. A consumer that checks for tool calls inside its own `for await` body looks
> before the handler has run, finds nothing, loops, and blocks forever on an iterator
> the SDK is no longer feeding — because the SDK is itself blocked on the suspended
> handler. Every conversation would hang on its first tool call.
>
> **The correction.** Because the query outlives a single HTTP request, the stream
> consumer must outlive it too. `Conversation` runs **one** consumer for the whole
> conversation, writing into whichever HTTP response is currently attached as its
> sink. A turn ends on whichever happens first:
>   - the tool handlers suspending (debounced by `SETTLE_MS = 50` so parallel calls in
>     one assistant message are handed back together), or
>   - the query finishing, or erroring.
>
> `SessionStore` holds `Conversation`s directly; the `iterator`/`collected` fields the
> draft bolted onto `LiveSession` are gone, since the conversation owns that state.

**Files:**
- Create: `dev/claude-bridge/conversation.ts` — the turn machine
- Create: `tests/features/claude-bridge/conversation.unit.spec.ts` — 8 tests
- Modify: `dev/claude-bridge/server.ts` — routes, SSE, the fast/replay paths
- Modify: `dev/claude-bridge/sessions.ts` — drop the unused optional fields

- [ ] **Step 1: Write the regression test first**

The test that matters uses a stream which yields an assistant message and then
*never closes*, exactly as the SDK behaves while a tool is pending:

```ts
const conv = new Conversation('k')
const never = new Promise<void>(() => {})
const turn = conv.beginTurn(() => {}, openStream([...], never))
conv.handleToolCall('mcp__bridge__get_weather', { city: 'Paris' }).catch(() => {})
const outcome = await turn      // must resolve; the draft design hangs here
assert.equal(outcome.type, 'tools')
```

- [ ] **Step 2: Implement `Conversation`, then wire `server.ts`**

`server.ts` keeps `MODELS` and the models route, adds `GET /_bridge/status`, and
`POST /v1/chat/completions` with two paths:
- **fast path** — `continuationOf(messages)` matches and the live conversation
  `awaits()` exactly those tool_call ids: `rekey` to the grown history's hash, attach
  the new sink, `deliverToolResults`, await the turn.
- **replay path** — anything else: a fresh `Conversation`, a tool server bound to its
  `handleToolCall`, and a `query()` built from `isolationOptions(NEUTRAL_CWD)`.

- [ ] **Step 3: Run every bridge unit test**

Run: `npm run test-unit tests/features/claude-bridge/`
Expected: 41 passed (3 isolation + 13 mapping + 5 tool-server + 12 sessions + 8 conversation)

- [ ] **Step 4: Smoke-test the bridge directly against a real model**

Two POSTs to `/v1/chat/completions` with a tool declared: the first must come back
`finish_reason: tool_calls` with `/_bridge/status` reporting `liveSessions: 1` (the
query suspended, not aborted); the second, replaying that call plus a `tool` result,
must return final text citing the result and drop back to `liveSessions: 0`.

- [ ] **Step 5: Verify the agents gateway can drive it**

Configure settings for `test-standalone1` with the bridge as an `openai-compatible`
provider (`compatibility: 'compatible'`), then POST to
`/api/gateway/user/test-standalone1/v1/chat/completions`. Authenticate as the
**account owner**, not superadmin — a superadmin cookie against another account's
gateway is rejected by `assertRoleQuota` with a 403 "You do not have permission to
use this model".

- [ ] **Step 6: Commit**

```bash
npm run lint-fix && npm run check-types
git add dev/claude-bridge/ tests/features/claude-bridge/
git commit -m "feat(dev): stream chat completions through the claude-bridge"
```

---

### Task 7: Document it

**Files:**
- Modify: `AGENTS.md` (Dev environment section)
- Modify: `dev/status.sh`

- [ ] **Step 1: Add the bridge to `dev/status.sh`**

Read the file first and follow its existing probe idiom exactly; add a probe for
`http://localhost:${BRIDGE_PORT:-3194}/_bridge/status` labelled `claude-bridge`, so a
developer who forgot to start it sees that rather than a confusing chat failure.

- [ ] **Step 2: Document the bridge in `AGENTS.md`**

Under "Dev environment", after the log-files list, add:

```markdown
### Running on Claude Code models

`npm run dev-bridge` starts a local OpenAI-compatible server (default port 3194) backed
by your Claude Code subscription, so the dev workspace can run on real models without an
API key. Logs go to `dev/logs/dev-bridge.log`.

Configure it in the settings UI as an **OpenAI Compatible** provider with base URL
`http://localhost:3194/v1` and **Compatibility Mode `compatible`** (the default mode
targets `/v1/responses`, which the bridge does not implement). Leave the API key empty.

Design and measurements:
`docs/superpowers/specs/2026-09-12-claude-code-bridge-and-simulation-harness-design.md`.
```

- [ ] **Step 3: Commit**

```bash
npm run lint-fix
git add AGENTS.md dev/status.sh
git commit -m "docs(dev): document the claude-code bridge"
```

---

## Self-Review

**Spec coverage:** §1.2 isolation → Task 2. §2.1 endpoints → Tasks 1, 6. §2.2 request mapping → Tasks 3, 4, 6. §2.3 suspended tool call → Tasks 4, 6. §2.4 session continuity → Tasks 5, 6. Testing section (pure functions, isolation invariant, session state machine) → Tasks 2-5. §3 (the harness) is **out of scope for this plan** — it gets its own document, since the bridge is independently useful and the harness depends on it.

**Known gap, deliberately left:** the spec's Testing section asks for session-continuity tests "with the SDK faked so it runs deterministically and offline". Task 5 tests the store and the continuation rule — the parts where a mistake is silent — but not the `freshTurn`/`nextTurn` wiring, which is verified manually in Task 6 Step 4. Faking `query()` well enough to test that wiring is a larger job than the wiring itself; if it proves fragile in use, that is the moment to build the fake.

**Type consistency:** `LiveSession` is extended once, additively, in Task 6 Step 2 — flagged there because Task 5 defines it. `MCP_SERVER_NAME` is used consistently as the MCP server key, the `mcp__bridge__` prefix source, and the `allowedTools` prefix.
