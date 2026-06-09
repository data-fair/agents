# Server-side Trace Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist chat traces on the server (one document per physical LLM request, written by the gateway), gated by an org setting + explicit per-user consent, auto-expired after 30 days, and viewable in the existing admin trace-review page.

**Architecture:** The gateway is the sole writer — in `POST /:type/:id/v1/chat/completions` it inserts one `traceRequests` document per model call when `settings.storeTraces` is on and the request carries an `x-trace-consent: yes` header (forwarded by the client from a consent cookie). Documents carry OTel-GenAI-aligned fields and a TTL. The trace-review page lists conversations, fetches their stored requests, and a pure `reconstructTrace()` rebuilds a `SessionTrace` for the unchanged viewer.

**Tech Stack:** Express + `@data-fair/lib-express`, MongoDB via `@data-fair/lib-node/mongo.js`, Vercel AI SDK (`ai`), Vue 3 + Vuetify, JSON-schema-driven types (`df-build-types`), Playwright tests (unit / api / e2e projects).

Spec: `docs/superpowers/specs/2026-06-08-server-trace-storage-design.md`.

**Canonical stored-document type** (used across Tasks 2–8 — names must match exactly):

```ts
export interface TraceRequest {
  owner: { type: string, id: string, department?: string }
  userId?: string
  userName?: string
  conversation: { id: string }
  contextId: string            // raw x-trace-ctx, e.g. "turn:<uid>" | "sub:<name>:<idx>:<uid>" | "compaction:<uid>"
  contextKind: 'turn' | 'sub' | 'compaction' | 'unknown'
  agent?: { name: string, index?: number }   // present only for sub-agent calls (gen_ai.agent.name)
  modelRole: string            // req.body.model: assistant | tools | summarizer | moderator | evaluator
  operation: { name: 'chat' }  // gen_ai.operation.name
  provider: { name: string, type: string }   // gen_ai.provider.name
  request: {
    model: string              // resolved model id (gen_ai.request.model)
    body: any                  // raw OpenAI request body (system+messages+tools+model role) — what the viewer's physical-request pane shows
    messageCount: number
    toolCount: number
    bodyChars: number
  }
  response: {                  // maps 1:1 to PhysicalRequestTrace.result (gen_ai.output.messages)
    content: string
    toolCalls: { id: string, name: string, arguments: string }[]
    finishReason?: string
  }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
  createdAt: string            // ISO; ordering key
  expiresAt: Date              // TTL target = createdAt + 30 days
}
```

> Refinement vs spec: we store the **raw `request.body`** (not split `systemInstructions`/`messages`/`tools`) because that is exactly what the viewer's physical-request detail pane renders and what reconstruction diffs; the OTel mapping still holds (`body.messages` = `gen_ai.input.messages`).

---

## Task 1: Add `storeTraces` org setting

**Files:**
- Modify: `api/types/settings/schema.js` (add top-level `storeTraces` property)
- Run: `npm run build-types`
- Test: `tests/features/settings/settings.api.spec.ts`

- [ ] **Step 1: Add the failing api test**

Append inside the existing `test.describe` block in `tests/features/settings/settings.api.spec.ts`:

```ts
test('persists the storeTraces flag', async () => {
  const base = {
    providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock', enabled: true }],
    models: { assistant: { model: { id: 'mock-model', name: 'Mock', provider: { type: 'mock', name: 'Mock', id: 'mock-provider' } }, inputPricePerMillion: 0, outputPricePerMillion: 0 } },
    quotas: { global: { unlimited: true, monthlyLimit: 0 }, admin: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 0 }, user: { unlimited: false, monthlyLimit: 0 }, external: { unlimited: false, monthlyLimit: 0 }, anonymous: { unlimited: false, monthlyLimit: 0 } },
    storeTraces: true
  }
  await superAdmin.put('/api/settings/user/test-standalone1', base)
  const res = await superAdmin.get('/api/settings/user/test-standalone1')
  assert.equal(res.data.storeTraces, true)
})
```

(If `superAdmin`/`assert` are not already imported in this file, mirror the imports already used by neighbouring tests in the same file.)

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test tests/features/settings/settings.api.spec.ts`
Expected: FAIL — `storeTraces` is stripped (not in schema) so `res.data.storeTraces` is `undefined`.

- [ ] **Step 3: Add the property to the schema**

In `api/types/settings/schema.js`, add to the top-level `properties` object (alongside `createdAt`/`updatedAt`, before `owner`):

```js
    storeTraces: {
      type: 'boolean',
      title: 'Store conversation traces',
      'x-i18n-title': {
        en: 'Store conversation traces',
        fr: 'Enregistrer les traces de conversation'
      },
      description: 'When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.',
      'x-i18n-description': {
        en: 'When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.',
        fr: 'Si activé, les conversations des utilisateurs consentants sont enregistrées sur le serveur pendant 30 jours pour relecture par un administrateur. Chaque utilisateur doit explicitement accepter.'
      },
      default: false
    },
```

- [ ] **Step 4: Regenerate types**

Run: `npm run build-types`
Expected: succeeds; `Settings` type now includes `storeTraces?: boolean`.

- [ ] **Step 5: Persist it in the settings router**

In `api/src/settings/router.ts`, in the PUT handler's `settings` object (after `quotas: body.quotas ?? defaultQuotas`), add:

```ts
    storeTraces: body.storeTraces ?? false
```

- [ ] **Step 6: Run the test — it passes**

Run: `npm run test tests/features/settings/settings.api.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/types/settings/schema.js api/types/settings/.type api/src/settings/router.ts tests/features/settings/settings.api.spec.ts
git commit -m "feat(settings): add storeTraces flag"
```

---

## Task 2: `traceRequests` collection, types & pure helpers

**Files:**
- Create: `api/src/traces/types.ts` (the `TraceRequest` interface above)
- Create: `api/src/traces/operations.ts` (pure: `parseContextId`, `buildTraceRequestDoc`)
- Modify: `api/src/mongo.ts` (collection getter + indexes)
- Test: `tests/features/traces/traces.unit.spec.ts`

- [ ] **Step 1: Write the failing unit test**

Create `tests/features/traces/traces.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { parseContextId, buildTraceRequestDoc } from '../../../api/src/traces/operations.ts'

test.describe('traces operations (unit)', () => {
  test('parseContextId classifies the three kinds', () => {
    assert.deepEqual(parseContextId('turn:abc'), { kind: 'turn', uid: 'abc' })
    assert.deepEqual(parseContextId('compaction:xyz'), { kind: 'compaction', uid: 'xyz' })
    assert.deepEqual(parseContextId('sub:Researcher:2:uid9'), { kind: 'sub', uid: 'uid9', agent: { name: 'Researcher', index: 2 } })
    assert.deepEqual(parseContextId('weird'), { kind: 'unknown', uid: 'weird' })
  })

  test('buildTraceRequestDoc sets TTL, agent and ordering fields', () => {
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      userId: 'u1',
      userName: 'User One',
      conversationId: 'conv1',
      contextId: 'sub:Researcher:0:uid1',
      modelRole: 'assistant',
      providerName: 'Mock', providerType: 'mock',
      resolvedModel: 'mock-model',
      body: { model: 'assistant', messages: [{ role: 'user', content: 'hi' }], tools: [] },
      response: { content: 'world', toolCalls: [], finishReason: 'stop' },
      usage: { inputTokens: 0, outputTokens: 0 },
      timing: { durationMs: 12 }
    }, now)

    assert.equal(doc.conversation.id, 'conv1')
    assert.equal(doc.contextKind, 'sub')
    assert.deepEqual(doc.agent, { name: 'Researcher', index: 0 })
    assert.equal(doc.request.messageCount, 1)
    assert.equal(doc.request.toolCount, 0)
    assert.equal(doc.createdAt, '2026-06-08T00:00:00.000Z')
    assert.equal(doc.expiresAt.getTime(), now.getTime() + 30 * 24 * 60 * 60 * 1000)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test tests/features/traces/traces.unit.spec.ts`
Expected: FAIL — module `api/src/traces/operations.ts` does not exist.

- [ ] **Step 3: Create the types file**

Create `api/src/traces/types.ts` containing exactly the `TraceRequest` interface from the plan header (copy it verbatim).

- [ ] **Step 4: Create the pure operations**

Create `api/src/traces/operations.ts`:

```ts
/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */
import type { TraceRequest } from './types.ts'

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export interface ParsedContext {
  kind: 'turn' | 'sub' | 'compaction' | 'unknown'
  uid: string
  agent?: { name: string, index?: number }
}

export function parseContextId (contextId: string): ParsedContext {
  const parts = (contextId ?? '').split(':')
  if (parts[0] === 'sub') {
    return { kind: 'sub', uid: parts.slice(3).join(':') || parts[parts.length - 1], agent: { name: parts[1] ?? '', index: Number(parts[2]) } }
  }
  if (parts[0] === 'compaction') return { kind: 'compaction', uid: parts.slice(1).join(':') }
  if (parts[0] === 'turn') return { kind: 'turn', uid: parts.slice(1).join(':') }
  return { kind: 'unknown', uid: contextId ?? '' }
}

export interface BuildTraceInput {
  owner: { type: string, id: string, department?: string }
  userId?: string
  userName?: string
  conversationId: string
  contextId: string
  modelRole: string
  providerName: string
  providerType: string
  resolvedModel: string
  body: any
  response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
}

export function buildTraceRequestDoc (input: BuildTraceInput, now: Date): TraceRequest {
  const ctx = parseContextId(input.contextId)
  const messages = Array.isArray(input.body?.messages) ? input.body.messages : []
  const tools = Array.isArray(input.body?.tools) ? input.body.tools : []
  return {
    owner: input.owner,
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.userName ? { userName: input.userName } : {}),
    conversation: { id: input.conversationId },
    contextId: input.contextId,
    contextKind: ctx.kind,
    ...(ctx.agent ? { agent: ctx.agent } : {}),
    modelRole: input.modelRole,
    operation: { name: 'chat' },
    provider: { name: input.providerName, type: input.providerType },
    request: {
      model: input.resolvedModel,
      body: input.body,
      messageCount: messages.length,
      toolCount: tools.length,
      bodyChars: JSON.stringify(input.body ?? {}).length
    },
    response: input.response,
    usage: input.usage,
    timing: input.timing,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RETENTION_MS)
  }
}
```

- [ ] **Step 5: Run the unit test — it passes**

Run: `npm run test tests/features/traces/traces.unit.spec.ts`
Expected: PASS.

- [ ] **Step 6: Register the collection + indexes**

In `api/src/mongo.ts`:
- Add the import near the top: `import type { TraceRequest } from './traces/types.ts'`
- Add a getter after the `usage` getter:

```ts
  get traceRequests () {
    return mongoLib.db.collection<TraceRequest>('trace-requests')
  }
```

- Add to the `mongoLib.configure({ ... })` object in `init()`, after the `usage` entry:

```ts
      'trace-requests': {
        'list-keys': [{ 'owner.type': 1, 'owner.id': 1, 'conversation.id': 1, createdAt: 1 }, {}],
        'recent-keys': [{ 'owner.type': 1, 'owner.id': 1, createdAt: -1 }, {}],
        'ttl-keys': [{ expiresAt: 1 }, { expireAfterSeconds: 0 }]
      }
```

(Index *names* are arbitrary; `expireAfterSeconds: 0` is what makes `expiresAt` a TTL index — Mongo deletes the doc when `expiresAt` passes.)

- [ ] **Step 7: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add api/src/traces/types.ts api/src/traces/operations.ts api/src/mongo.ts tests/features/traces/traces.unit.spec.ts
git commit -m "feat(traces): trace-requests collection, types and pure helpers"
```

---

## Task 3: Record trace requests in the gateway

**Files:**
- Create: `api/src/traces/service.ts` (`recordTraceRequest`)
- Modify: `api/src/gateway/router.ts` (capture + insert; `x-trace-storage` header)
- Test: `tests/features/traces/traces.api.spec.ts`

- [ ] **Step 1: Write the failing api test**

Create `tests/features/traces/traces.api.spec.ts`:

```ts
/** stateful API tests for server-side trace storage */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin

const settingsData = (storeTraces: boolean) => ({
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }, inputPricePerMillion: 0, outputPricePerMillion: 0 } },
  quotas: { global: { unlimited: true, monthlyLimit: 0 }, admin: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 0 }, user: { unlimited: false, monthlyLimit: 0 }, external: { unlimited: false, monthlyLimit: 0 }, anonymous: { unlimited: false, monthlyLimit: 0 } },
  storeTraces
})

async function chat (storeTraces: boolean, headers: Record<string, string>) {
  await admin.put('/api/settings/user/test-standalone1', settingsData(storeTraces))
  const cookieString = await user.cookieJar.getCookieString(directoryUrl)
  const provider = createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
    apiKey: 'unused',
    headers: { cookie: cookieString, ...headers },
    name: 'data-fair-gateway'
  })
  await generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] })
}

test.describe('Trace storage API', () => {
  test.beforeEach(async () => { await clean() })

  test('stores a trace request when enabled AND consented', async () => {
    await chat(true, { 'x-trace-consent': 'yes', 'x-trace-conversation': 'conv-A', 'x-trace-ctx': 'turn:t1' })
    // poll: recording is fire-and-forget
    let list: any
    for (let i = 0; i < 20; i++) {
      const res = await admin.get('/api/traces/user/test-standalone1')
      if (res.data.results.length > 0) { list = res.data; break }
      await new Promise(r => setTimeout(r, 100))
    }
    assert.ok(list, 'a conversation should have been stored')
    assert.equal(list.results[0].conversationId, 'conv-A')
    assert.equal(list.results[0].requestCount, 1)
  })

  test('stores nothing without consent', async () => {
    await chat(true, { 'x-trace-conversation': 'conv-B', 'x-trace-ctx': 'turn:t1' })
    await new Promise(r => setTimeout(r, 500))
    const res = await admin.get('/api/traces/user/test-standalone1')
    assert.equal(res.data.results.length, 0)
  })

  test('stores nothing when the org setting is off', async () => {
    await chat(false, { 'x-trace-consent': 'yes', 'x-trace-conversation': 'conv-C', 'x-trace-ctx': 'turn:t1' })
    await new Promise(r => setTimeout(r, 500))
    const res = await admin.get('/api/traces/user/test-standalone1')
    assert.equal(res.data.results.length, 0)
  })
})
```

(The `GET /api/traces/...` endpoint is built in Task 4; this test will only fully pass after Task 4. Run the recording-specific assertions then. If you implement Task 3 alone, temporarily assert against `mongo.traceRequests.countDocuments(...)` instead — but the recommended flow is to land Tasks 3 and 4 together before running this spec.)

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: FAIL — nothing is recorded / no traces endpoint.

- [ ] **Step 3: Create the recording service**

Create `api/src/traces/service.ts`:

```ts
/**
 * service.ts contains stateful logic for trace storage
 */
import mongo from '#mongo'
import type { TraceRequest } from './types.ts'
import { buildTraceRequestDoc, type BuildTraceInput } from './operations.ts'

export type { TraceRequest } from './types.ts'

// Fire-and-forget: never throws into the caller's request path.
export async function recordTraceRequest (input: BuildTraceInput): Promise<void> {
  try {
    const doc = buildTraceRequestDoc(input, new Date())
    await mongo.traceRequests.insertOne(doc as TraceRequest)
  } catch {
    // swallow — trace recording must never affect the chat response
  }
}
```

- [ ] **Step 4: Capture model role config in the gateway**

In `api/src/gateway/router.ts`, change the destructuring at line ~195 from:

```ts
    const { inputPricePerMillion, outputPricePerMillion } = getModelConfig(settings, modelId)
```

to also keep the model config:

```ts
    const { modelConfig, inputPricePerMillion, outputPricePerMillion } = getModelConfig(settings, modelId)
```

(`modelConfig.provider` already carries `{ type, name, id }` — no extra provider lookup is needed for the trace document.)

- [ ] **Step 5: Add the storage gate + response header (before streaming)**

In `api/src/gateway/router.ts`, after `const model = await getModelForGateway(settings, modelId)` (~line 196) add:

```ts
    const storeTraces = settings.storeTraces === true
    if (storeTraces) res.setHeader('x-trace-storage', 'available')
    const consented = req.get('x-trace-consent') === 'yes'
    const shouldStoreTrace = storeTraces && consented
    const traceConversationId = req.get('x-trace-conversation') || undefined
    const traceContextId = req.get('x-trace-ctx') || 'unknown'
    const traceStart = Date.now()
    const recordTrace = (response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }, usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }, timeToFirstChunkMs?: number) => {
      if (!shouldStoreTrace || !traceConversationId) return
      void recordTraceRequest({
        owner,
        userId: usageUserId,
        userName: usageUserName,
        conversationId: traceConversationId,
        contextId: traceContextId,
        modelRole: modelId,
        providerName: modelConfig.provider.name,
        providerType: modelConfig.provider.type,
        resolvedModel: modelConfig.id,
        body: req.body,
        response,
        usage,
        timing: { durationMs: Date.now() - traceStart, ...(timeToFirstChunkMs != null ? { timeToFirstChunkMs } : {}) }
      })
    }
```

Add the import at the top of the file (next to the other `../` imports):

```ts
import { recordTraceRequest } from '../traces/service.ts'
```

- [ ] **Step 6: Record on the non-streaming path**

In the `else` branch (non-stream), after the `res.json({...})` call (~line 361), add:

```ts
      recordTrace(
        {
          content: result.text || '',
          toolCalls: (result.toolCalls ?? []).map((tc: { toolCallId: string, toolName: string, input?: unknown }) => ({ id: tc.toolCallId, name: tc.toolName, arguments: JSON.stringify(tc.input ?? {}) })),
          finishReason: mapFinishReason(result.finishReason as FinishReason)
        },
        { inputTokens, outputTokens, cacheReadTokens: result.usage?.inputTokenDetails?.cacheReadTokens, cacheWriteTokens: result.usage?.inputTokenDetails?.cacheWriteTokens }
      )
```

- [ ] **Step 7: Record on the streaming path**

In the streaming branch, accumulate text + first-chunk timing and record after the stream ends. Replace the streaming `for await` loop body so that:
  - declare before the loop: `let streamedText = ''` and `let ttfc: number | undefined`.
  - on the `text-delta` branch, prepend `streamedText += part.text` and, on the first part, `if (ttfc === undefined) ttfc = Date.now() - traceStart`.
  - on the `finish` branch, after writing the final chunk, add:

```ts
            const finalToolCalls = (await result.toolCalls).map((tc: { toolCallId: string, toolName: string, input?: unknown }) => ({ id: tc.toolCallId, name: tc.toolName, arguments: JSON.stringify(tc.input ?? {}) }))
            recordTrace(
              { content: streamedText, toolCalls: finalToolCalls, finishReason: mapFinishReason(part.finishReason as FinishReason) },
              { inputTokens, outputTokens, cacheReadTokens: part.totalUsage?.inputTokenDetails?.cacheReadTokens, cacheWriteTokens: part.totalUsage?.inputTokenDetails?.cacheWriteTokens },
              ttfc
            )
```

(`result.toolCalls` is a Promise on the `streamText` result that resolves once the stream is consumed; awaiting it inside the `finish` branch is safe.)

- [ ] **Step 8: Land Task 4, then run the api test**

Implement Task 4 (the read API), then:
Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: PASS (recording + no-consent + setting-off cases).

- [ ] **Step 9: Commit**

```bash
git add api/src/traces/service.ts api/src/gateway/router.ts
git commit -m "feat(gateway): record physical requests to trace storage on consent"
```

---

## Task 4: Trace read/delete API

**Files:**
- Create: `api/src/traces/router.ts`
- Modify: `api/src/app.ts` (mount the router)
- Test: `tests/features/traces/traces.api.spec.ts` (extend)

- [ ] **Step 1: Write failing api tests for list/get/delete/erasure + admin gating**

Append to `tests/features/traces/traces.api.spec.ts` (reuses the `chat` helper above):

```ts
test.describe('Trace read/delete API', () => {
  test.beforeEach(async () => { await clean() })

  test('non-admin cannot list traces', async () => {
    const other = await axiosAuth('test1-user1')
    await assert.rejects(() => other.get('/api/traces/user/test-standalone1'))
  })

  test('get + delete a conversation', async () => {
    await chat(true, { 'x-trace-consent': 'yes', 'x-trace-conversation': 'conv-D', 'x-trace-ctx': 'turn:t1' })
    // wait for the write
    for (let i = 0; i < 20; i++) {
      const l = await admin.get('/api/traces/user/test-standalone1')
      if (l.data.results.length) break
      await new Promise(r => setTimeout(r, 100))
    }
    const conv = await admin.get('/api/traces/user/test-standalone1/conv-D')
    assert.equal(conv.data.results.length, 1)
    assert.equal(conv.data.results[0].request.body.model, 'assistant')
    await admin.delete('/api/traces/user/test-standalone1/conv-D')
    const after = await admin.get('/api/traces/user/test-standalone1')
    assert.equal(after.data.results.length, 0)
  })
})
```

- [ ] **Step 2: Run and watch fail**

Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: FAIL — `/api/traces` is not mounted (404 / connection).

- [ ] **Step 3: Create the router**

Create `api/src/traces/router.ts`:

```ts
/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 */
import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'

const router = Router()
export default router

router.get('/:type/:id', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')

  const ownerFilter = { 'owner.type': owner.type, 'owner.id': owner.id }
  // one row per conversation: first user message + counts
  const results = await mongo.traceRequests.aggregate([
    { $match: ownerFilter },
    { $sort: { createdAt: 1 } },
    { $group: {
      _id: '$conversation.id',
      startedAt: { $first: '$createdAt' },
      userName: { $first: '$userName' },
      userId: { $first: '$userId' },
      firstBody: { $first: '$request.body' },
      requestCount: { $sum: 1 }
    } },
    { $sort: { startedAt: -1 } },
    { $limit: 200 }
  ]).toArray()

  res.json({
    results: results.map((r: any) => ({
      conversationId: r._id,
      startedAt: r.startedAt,
      userName: r.userName,
      userId: r.userId,
      requestCount: r.requestCount,
      preview: firstUserMessage(r.firstBody)
    }))
  })
})

router.get('/:type/:id/:conversationId', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const results = await mongo.traceRequests
    .find({ 'owner.type': owner.type, 'owner.id': owner.id, 'conversation.id': req.params.conversationId }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray()
  res.json({ results })
})

router.delete('/:type/:id/:conversationId', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  await mongo.traceRequests.deleteMany({ 'owner.type': owner.type, 'owner.id': owner.id, 'conversation.id': req.params.conversationId })
  res.status(204).send()
})

router.delete('/:type/:id', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const userId = req.query.userId
  if (typeof userId !== 'string') { res.status(400).json({ error: { message: 'userId query parameter is required' } }); return }
  await mongo.traceRequests.deleteMany({ 'owner.type': owner.type, 'owner.id': owner.id, userId })
  res.status(204).send()
})

function firstUserMessage (body: any): string {
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const firstUser = messages.find((m: any) => m.role === 'user')
  const content = firstUser?.content
  if (typeof content === 'string') return content.slice(0, 150)
  if (Array.isArray(content)) {
    const text = content.find((c: any) => c.type === 'text')
    return (text?.text ?? '').slice(0, 150)
  }
  return ''
}
```

- [ ] **Step 4: Mount the router**

In `api/src/app.ts`, mirror how the `settings` router is mounted. Add the import next to the other routers:

```ts
import tracesRouter from './traces/router.ts'
```

and mount it next to the other `app.use('/api/...')` lines:

```ts
app.use('/api/traces', tracesRouter)
```

(Match the exact mounting style used for `settings` — e.g. if it uses `apiDocBasePath` or a session middleware wrapper, copy that wrapper.)

- [ ] **Step 5: Run the full traces api spec — it passes**

Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: PASS (recording from Task 3 + list/get/delete + admin gating).

- [ ] **Step 6: Commit**

```bash
git add api/src/traces/router.ts api/src/app.ts tests/features/traces/traces.api.spec.ts
git commit -m "feat(traces): admin read/delete API with GDPR per-user erasure"
```

---

## Task 5: `reconstructTrace` (client) + unit tests

**Files:**
- Create: `ui/src/traces/reconstruct-trace.ts`
- Test: `tests/features/traces/reconstruct.unit.spec.ts`

This rebuilds a `SessionTrace` (see `ui/src/traces/session-recorder.ts`) from the stored documents so the existing viewer renders unchanged.

- [ ] **Step 1: Write the failing unit test**

Create `tests/features/traces/reconstruct.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { reconstructTrace } from '../../../ui/src/traces/reconstruct-trace.ts'

// minimal stored-request fixture
const req = (over: any) => ({
  conversation: { id: 'c1' },
  contextId: 'turn:t1', contextKind: 'turn',
  modelRole: 'assistant', operation: { name: 'chat' }, provider: { name: 'Mock', type: 'mock' },
  request: { model: 'm', body: { model: 'assistant', messages: [], tools: [] }, messageCount: 0, toolCount: 0, bodyChars: 2 },
  response: { content: '', toolCalls: [], finishReason: 'stop' },
  usage: { inputTokens: 0, outputTokens: 0 }, timing: { durationMs: 1 },
  createdAt: '2026-06-08T00:00:00.000Z',
  ...over
})

test.describe('reconstructTrace (unit)', () => {
  test('maps physical requests 1:1 and extracts the system prompt + tools', () => {
    const reqs = [req({
      createdAt: '2026-06-08T00:00:00.000Z',
      request: { model: 'm', body: { model: 'assistant', messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'hello' }
      ], tools: [{ type: 'function', function: { name: 'search', description: 'find', parameters: { type: 'object' } } }] }, messageCount: 2, toolCount: 1, bodyChars: 50 },
      response: { content: 'world', toolCalls: [], finishReason: 'stop' }
    })]
    const trace = reconstructTrace(reqs as any)
    assert.equal(trace.systemPrompt, 'You are helpful.')
    assert.equal(trace.physicalRequests.length, 1)
    assert.equal(trace.physicalRequests[0].modelRole, 'assistant')
    assert.equal(trace.physicalRequests[0].result.content, 'world')
    assert.equal(trace.toolSnapshots[0][0].name, 'search')
    assert.equal(trace.turns.length, 1)
    assert.equal(trace.turns[0].userMessage, 'hello')
  })

  test('pairs a tool call with its result from the next request', () => {
    const reqs = [
      req({
        createdAt: '2026-06-08T00:00:00.000Z',
        request: { model: 'm', body: { model: 'assistant', messages: [{ role: 'user', content: 'go' }], tools: [] }, messageCount: 1, toolCount: 0, bodyChars: 20 },
        response: { content: '', toolCalls: [{ id: 'tc1', name: 'search', arguments: '{"q":"x"}' }], finishReason: 'tool-calls' }
      }),
      req({
        createdAt: '2026-06-08T00:00:01.000Z',
        request: { model: 'm', body: { model: 'assistant', messages: [
          { role: 'user', content: 'go' },
          { role: 'assistant', content: '', tool_calls: [{ id: 'tc1', type: 'function', function: { name: 'search', arguments: '{"q":"x"}' } }] },
          { role: 'tool', tool_call_id: 'tc1', content: '{"hits":3}' }
        ], tools: [] }, messageCount: 3, toolCount: 0, bodyChars: 80 },
        response: { content: 'found 3', toolCalls: [], finishReason: 'stop' }
      })
    ]
    const trace = reconstructTrace(reqs as any)
    const calls = trace.turns[0].steps.flatMap(s => s.toolCalls)
    const tc = calls.find(c => c.id === 'tc1')
    assert.ok(tc, 'tool call reconstructed')
    assert.equal(JSON.parse(tc!.output as string).hits ?? (tc!.output as any).hits, 3)
  })

  test('groups sub-agent requests under their agent name', () => {
    const reqs = [
      req({ createdAt: '2026-06-08T00:00:00.000Z', response: { content: '', toolCalls: [{ id: 'd1', name: 'delegate', arguments: '{}' }], finishReason: 'tool-calls' } }),
      req({ createdAt: '2026-06-08T00:00:00.500Z', contextId: 'sub:Researcher:0:s1', contextKind: 'sub', agent: { name: 'Researcher', index: 0 },
        request: { model: 'm', body: { model: 'tools', messages: [{ role: 'user', content: 'research X' }], tools: [] }, messageCount: 1, toolCount: 0, bodyChars: 30 },
        response: { content: 'did research', toolCalls: [], finishReason: 'stop' } })
    ]
    const trace = reconstructTrace(reqs as any)
    const sub = trace.turns[0].steps.flatMap(s => s.toolCalls).map(c => c.subAgent).find(Boolean)
    assert.ok(sub, 'sub-agent block exists')
    assert.equal(sub!.name, 'Researcher')
    assert.ok(sub!.steps.length >= 1)
  })
})
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm run test tests/features/traces/reconstruct.unit.spec.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `reconstructTrace`**

Create `ui/src/traces/reconstruct-trace.ts`:

```ts
import type { SessionTrace, PhysicalRequestTrace, TurnTrace, StepTrace, ToolCallTrace, ToolSnapshot, SubAgentTrace } from './session-recorder.ts'

export interface StoredTraceRequest {
  conversation: { id: string }
  contextId: string
  contextKind: 'turn' | 'sub' | 'compaction' | 'unknown'
  agent?: { name: string, index?: number }
  modelRole: string
  request: { model: string, body: any, messageCount: number, toolCount: number, bodyChars: number }
  response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
  createdAt: string
}

const ts = (iso: string) => new Date(iso)

function toolSnapshotsFromBody (body: any): ToolSnapshot[] {
  const tools = Array.isArray(body?.tools) ? body.tools : []
  return tools.map((t: any) => ({
    name: t.function?.name ?? t.name ?? '',
    description: t.function?.description ?? '',
    inputSchema: t.function?.parameters ?? {}
  }))
}

function systemPromptFromBody (body: any): string {
  const messages = Array.isArray(body?.messages) ? body.messages : []
  return messages.filter((m: any) => m.role === 'system').map((m: any) => (typeof m.content === 'string' ? m.content : '')).join('\n')
}

function lastUserMessage (body: any): string {
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const users = messages.filter((m: any) => m.role === 'user')
  const last = users[users.length - 1]
  if (typeof last?.content === 'string') return last.content
  if (Array.isArray(last?.content)) return last.content.find((c: any) => c.type === 'text')?.text ?? ''
  return ''
}

// Index every tool result (tool-role message) across the whole conversation by tool_call_id.
function buildToolResultIndex (requests: StoredTraceRequest[]): Map<string, any> {
  const map = new Map<string, any>()
  for (const r of requests) {
    const messages = Array.isArray(r.request.body?.messages) ? r.request.body.messages : []
    for (const m of messages) {
      if (m.role === 'tool' && m.tool_call_id) {
        let output: any = m.content
        try { output = typeof m.content === 'string' ? JSON.parse(m.content) : m.content } catch { /* keep string */ }
        if (!map.has(m.tool_call_id)) map.set(m.tool_call_id, output)
      }
    }
  }
  return map
}

export function reconstructTrace (requests: StoredTraceRequest[]): SessionTrace {
  const sorted = [...requests].sort((a, b) => ts(a.createdAt).getTime() - ts(b.createdAt).getTime())

  const physicalRequests: PhysicalRequestTrace[] = sorted.map(r => ({
    contextId: r.contextId,
    timestamp: ts(r.createdAt),
    modelRole: r.modelRole,
    requestBody: r.request.body,
    result: { content: r.response.content, toolCalls: r.response.toolCalls, finishReason: r.response.finishReason },
    inputTokens: r.usage.inputTokens,
    outputTokens: r.usage.outputTokens,
    cacheReadTokens: r.usage.cacheReadTokens,
    cacheWriteTokens: r.usage.cacheWriteTokens,
    messageCount: r.request.messageCount,
    toolCount: r.request.toolCount,
    bodyChars: r.request.bodyChars,
    durationMs: r.timing.durationMs,
    timeToFirstChunkMs: r.timing.timeToFirstChunkMs
  }))

  const toolResults = buildToolResultIndex(sorted)

  // tool snapshots: push one per distinct tool-set as it changes across main-turn requests
  const toolSnapshots: ToolSnapshot[][] = []
  const toolChanges: { timestamp: Date, tools: ToolSnapshot[] }[] = []
  let lastToolNames = ''
  for (const r of sorted.filter(r => r.contextKind !== 'sub')) {
    const snap = toolSnapshotsFromBody(r.request.body)
    const key = snap.map(s => s.name).join(',')
    if (snap.length && key !== lastToolNames) {
      toolSnapshots.push(snap)
      toolChanges.push({ timestamp: ts(r.createdAt), tools: snap })
      lastToolNames = key
    }
  }

  const systemPrompt = systemPromptFromBody(sorted.find(r => r.contextKind !== 'sub')?.request.body)

  // group sub-agent requests by "name:index"
  const subByKey = new Map<string, StoredTraceRequest[]>()
  for (const r of sorted) {
    if (r.contextKind === 'sub' && r.agent) {
      const key = `${r.agent.name}:${r.agent.index ?? 0}`
      const arr = subByKey.get(key) ?? []
      arr.push(r)
      subByKey.set(key, arr)
    }
  }
  const usedSubKeys = new Set<string>()
  let subOrder = 0
  const nextSubForName = (name: string): SubAgentTrace | undefined => {
    // attach sub-agents in encounter order; match by name, fall back to any unused
    const entry = [...subByKey.entries()].find(([k]) => k.startsWith(`${name}:`) && !usedSubKeys.has(k)) ??
                  [...subByKey.entries()].find(([k]) => !usedSubKeys.has(k))
    if (!entry) return undefined
    usedSubKeys.add(entry[0])
    const reqs = entry[1]
    return {
      name: reqs[0].agent!.name,
      systemPrompt: systemPromptFromBody(reqs[0].request.body),
      tools: toolSnapshotsFromBody(reqs[0].request.body),
      task: lastUserMessage(reqs[0].request.body),
      turnIndex: reqs[0].agent!.index,
      steps: reqs.map(sr => ({
        timestamp: ts(sr.createdAt),
        messages: [{ role: 'assistant', content: sr.response.content }] as any,
        finishReason: sr.response.finishReason,
        toolCalls: sr.response.toolCalls.map(tc => ({ id: tc.id, toolName: tc.name, input: safeJson(tc.arguments), output: toolResults.get(tc.id) ?? null, timestamp: ts(sr.createdAt) }))
      }))
    }
  }

  // build turns from main-context requests grouped by context uid (turnCtxId is stable per turn)
  const mainReqs = sorted.filter(r => r.contextKind === 'turn' || r.contextKind === 'unknown')
  const turnsByUid = new Map<string, StoredTraceRequest[]>()
  const uidOrder: string[] = []
  for (const r of mainReqs) {
    const uid = r.contextId
    if (!turnsByUid.has(uid)) { turnsByUid.set(uid, []); uidOrder.push(uid) }
    turnsByUid.get(uid)!.push(r)
  }

  const turns: TurnTrace[] = uidOrder.map(uid => {
    const reqs = turnsByUid.get(uid)!
    const steps: StepTrace[] = reqs.map(r => {
      const toolCalls: ToolCallTrace[] = r.response.toolCalls.map(tc => {
        const call: ToolCallTrace = { id: tc.id, toolName: tc.name, input: safeJson(tc.arguments), output: toolResults.get(tc.id) ?? null, timestamp: ts(r.createdAt) }
        const sub = nextSubForName(tc.name)
        if (sub) call.subAgent = sub
        return call
      })
      return {
        timestamp: ts(r.createdAt),
        messages: r.response.content ? ([{ role: 'assistant', content: r.response.content }] as any) : [],
        finishReason: r.response.finishReason,
        toolCalls
      }
    })
    return { userMessage: lastUserMessage(reqs[0].request.body), timestamp: ts(reqs[0].createdAt), steps }
  })

  return { systemPrompt, toolSnapshots, toolChanges, turns, physicalRequests }
}

function safeJson (s: string): any { try { return JSON.parse(s) } catch { return s } }
```

- [ ] **Step 4: Run the unit tests — iterate until they pass**

Run: `npm run test tests/features/traces/reconstruct.unit.spec.ts`
Expected: PASS for all three (system-prompt/physical mapping, tool-result pairing, sub-agent grouping). If a case fails, adjust the implementation against the fixture — the tests define the contract.

- [ ] **Step 5: Commit**

```bash
git add ui/src/traces/reconstruct-trace.ts tests/features/traces/reconstruct.unit.spec.ts
git commit -m "feat(traces): reconstruct SessionTrace from stored physical requests"
```

---

## Task 6: Client — conversation id, consent header, ctx enrichment

**Files:**
- Create: `ui/src/traces/trace-consent.ts` (cookie get/set + reactive available flag)
- Modify: `ui/src/composables/use-agent-chat.ts` (headers + reading the response header)
- Test: `tests/features/traces/trace-consent.unit.spec.ts`

- [ ] **Step 1: Write the failing unit test for the consent helper**

Create `tests/features/traces/trace-consent.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readConsent, serializeConsentCookie, CONSENT_COOKIE } from '../../../ui/src/traces/trace-consent.ts'

test.describe('trace consent (unit)', () => {
  test('reads consent value from a cookie string', () => {
    assert.equal(readConsent(`${CONSENT_COOKIE}=yes; other=1`), 'yes')
    assert.equal(readConsent('other=1'), undefined)
  })
  test('serializes a 1-year cookie', () => {
    const c = serializeConsentCookie('no')
    assert.match(c, new RegExp(`^${CONSENT_COOKIE}=no;`))
    assert.match(c, /Max-Age=31536000/)
    assert.match(c, /SameSite=Lax/)
  })
})
```

- [ ] **Step 2: Run and watch fail**

Run: `npm run test tests/features/traces/trace-consent.unit.spec.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the consent helper**

Create `ui/src/traces/trace-consent.ts`:

```ts
import { ref } from 'vue'

export const CONSENT_COOKIE = 'agent-chat-trace-consent'
export type Consent = 'yes' | 'no'

// Reactive: set true when the gateway advertises x-trace-storage: available.
export const traceStorageAvailable = ref(false)

export function readConsent (cookieString = document.cookie): Consent | undefined {
  for (const part of cookieString.split(';')) {
    const [k, v] = part.trim().split('=')
    if (k === CONSENT_COOKIE) return v === 'yes' ? 'yes' : v === 'no' ? 'no' : undefined
  }
  return undefined
}

export function serializeConsentCookie (value: Consent): string {
  return `${CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`
}

export function writeConsent (value: Consent): void {
  document.cookie = serializeConsentCookie(value)
}
```

- [ ] **Step 4: Run the helper test — passes**

Run: `npm run test tests/features/traces/trace-consent.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Wire headers + storage-available detection into `use-agent-chat.ts`**

In `ui/src/composables/use-agent-chat.ts`:

- Add imports near the top:

```ts
import { readConsent, traceStorageAvailable } from '~/traces/trace-consent'
```

- Generate a stable conversation id once per composable instance (near where `recorder` is read, ~line 117):

```ts
  const conversationId = crypto.randomUUID()
```

- In `tracingFetch` (~line 281), after `const res = await fetch(...)` and before returning, detect the advertised header:

```ts
    if (res.headers.get('x-trace-storage') === 'available') traceStorageAvailable.value = true
```

- Add a helper that augments per-call headers with conversation id + consent, and merge it everywhere a gateway call sets `x-trace-ctx`. Define near `traceCtxOf` (~line 233):

```ts
  function traceHeaders (ctx: string): Record<string, string> {
    const consent = readConsent()
    return {
      'x-trace-ctx': ctx,
      'x-trace-conversation': conversationId,
      ...(consent ? { 'x-trace-consent': consent } : {})
    }
  }
```

- Replace each existing `headers: { 'x-trace-ctx': <id> }` spread (the `...(recorder ? { headers: { 'x-trace-ctx': turnCtxId } } : {})` sites at lines ~452, ~590, ~595, ~651, ~688) with `...(recorder ? { headers: traceHeaders(<id>) } : {})`, and **prefix the ctx ids by kind**:
  - main turn id → `` `turn:${turnCtxId}` ``
  - sub-agent id → `` `sub:${displayName}:${callIndex}:${subCtxId}` `` (the `displayName` and `callIndex` are already in scope where `startSubAgent` is called, ~line 566)
  - compaction id → `` `compaction:${compactionCtxId}` ``

(Keep the existing `recorder.startTurn` / `startSubAgent` calls unchanged — only the header ctx strings get the kind prefix. The client-side recorder still receives the raw ids it always did because it does not parse `x-trace-ctx`; only the gateway does.)

- [ ] **Step 6: Type-check + lint**

Run: `npm run check-types && npm run lint-fix`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add ui/src/traces/trace-consent.ts ui/src/composables/use-agent-chat.ts tests/features/traces/trace-consent.unit.spec.ts
git commit -m "feat(chat): send conversation id, kind-tagged ctx and consent header to gateway"
```

---

## Task 7: Consent UI (bottom-sheet + Settings toggle)

**Files:**
- Create: `ui/src/components/agent-chat/TraceConsentSheet.vue`
- Modify: `ui/src/components/AgentChat.vue` (mount the sheet)
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue` (Settings-tab toggle)
- Test: `tests/features/traces/trace-consent.e2e.spec.ts`

- [ ] **Step 1: Build the consent sheet**

Create `ui/src/components/agent-chat/TraceConsentSheet.vue` (mirrors `portals/.../accept-cookies.vue`):

```vue
<template>
  <v-bottom-sheet
    v-model="show"
    :max-width="600"
    persistent
    inset
  >
    <v-sheet rounded class="text-center pa-6">
      <p>{{ t('message') }}</p>
      <p class="text-medium-emphasis text-caption">{{ t('details') }}</p>
      <div class="d-flex justify-center ga-3 mt-4">
        <v-btn variant="text" @click="choose('no')">{{ t('decline') }}</v-btn>
        <v-btn color="primary" @click="choose('yes')">{{ t('accept') }}</v-btn>
      </div>
    </v-sheet>
  </v-bottom-sheet>
</template>

<i18n lang="yaml">
en:
  message: This assistant can store your conversation on the server so an administrator can review it.
  details: Your choice is remembered for 1 year. Stored conversations are deleted after 30 days. You can change your choice anytime in the chat settings.
  accept: Accept
  decline: Decline
fr:
  message: Cet assistant peut enregistrer votre conversation sur le serveur afin qu'un administrateur puisse la consulter.
  details: Votre choix est conservé pendant 1 an. Les conversations enregistrées sont supprimées au bout de 30 jours. Vous pouvez modifier votre choix à tout moment dans les paramètres du chat.
  accept: Accepter
  decline: Refuser
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { traceStorageAvailable, readConsent, writeConsent, type Consent } from '~/traces/trace-consent'

const { t } = useI18n()
const dismissed = ref(false)
const show = computed(() => traceStorageAvailable.value && readConsent() === undefined && !dismissed.value)

const choose = (value: Consent) => {
  writeConsent(value)
  dismissed.value = true
}

// keep reactive when availability flips on after the first response
watch(traceStorageAvailable, () => { /* recompute show */ })
</script>
```

- [ ] **Step 2: Mount the sheet in `AgentChat.vue`**

In `ui/src/components/AgentChat.vue`, import and place `<trace-consent-sheet />` inside the root template (anywhere at the top level of the chat container):

```vue
<trace-consent-sheet />
```

```ts
import TraceConsentSheet from '~/components/agent-chat/TraceConsentSheet.vue'
```

- [ ] **Step 3: Add a toggle to the Settings tab**

In `ui/src/components/agent-chat/AgentChatDebugDialog.vue`, find the Settings tab that hosts the tool-exploration toggle and add (only shown once storage is available):

```vue
<v-switch
  v-if="traceStorageAvailable"
  :model-value="consent === 'yes'"
  :label="t('storeTraces')"
  color="primary"
  hide-details
  @update:model-value="v => { writeConsent(v ? 'yes' : 'no'); consent = v ? 'yes' : 'no' }"
/>
```

with script additions:

```ts
import { traceStorageAvailable, readConsent, writeConsent } from '~/traces/trace-consent'
const consent = ref(readConsent())
```

and i18n keys `storeTraces` (en: "Store my conversations for review", fr: "Enregistrer mes conversations pour relecture") in that component's `<i18n>` block.

- [ ] **Step 4: Write the e2e test**

Create `tests/features/traces/trace-consent.e2e.spec.ts` following the pattern in `tests/features/trace-review/trace-review.e2e.spec.ts` and `tests/features/settings/settings.e2e.spec.ts`:
  - As admin, PUT settings with `storeTraces: true` and a mock provider/assistant model for `user/<self>`.
  - Open the chat page, send `hello`, wait for the response.
  - Assert the consent bottom-sheet becomes visible (`getByText` of the message).
  - Click **Accept**; reload; send another message; assert the sheet does NOT reappear.
  - (Optional second test) with `storeTraces: false`, assert the sheet never appears.

Use existing chat e2e helpers; reuse the build/seed steps already used by `chat-*` e2e specs.

- [ ] **Step 5: Build workspace packages then run e2e**

Run:
```bash
cd lib-vuetify && npm run build && cd ..
cd lib-vue && npm run build && cd ..
npm run test tests/features/traces/trace-consent.e2e.spec.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/components/agent-chat/TraceConsentSheet.vue ui/src/components/AgentChat.vue ui/src/components/agent-chat/AgentChatDebugDialog.vue tests/features/traces/trace-consent.e2e.spec.ts
git commit -m "feat(chat): trace-storage consent sheet and settings toggle"
```

---

## Task 8: Trace-review — browse stored conversations

**Files:**
- Modify: `ui/src/pages/[type]/[id]/trace-review.vue` (add stored-trace list source + delete)
- Test: extend `tests/features/trace-review/trace-review.e2e.spec.ts` (or a new spec in `tests/features/traces/`)

- [ ] **Step 1: Add the stored-traces list + loader to the review page**

In `ui/src/pages/[type]/[id]/trace-review.vue`:
  - On mount (for admins), in addition to `readHandoff()`, fetch the conversation list:

```ts
import { reconstructTrace } from '~/traces/reconstruct-trace'
const stored = ref<{ conversationId: string, preview: string, userName?: string, startedAt: string, requestCount: number }[]>([])
const fetchStored = async () => {
  const res = await fetch(`${window.location.origin}${$apiPath}/traces/${accountType}/${accountId}`, { credentials: 'include' })
  if (res.ok) stored.value = (await res.json()).results
}
const loadStored = async (conversationId: string) => {
  const res = await fetch(`${window.location.origin}${$apiPath}/traces/${accountType}/${accountId}/${conversationId}`, { credentials: 'include' })
  if (!res.ok) return
  const requests = (await res.json()).results
  recorder.value = SessionRecorder.fromTrace(reconstructTrace(requests))
  loadCount.value++
}
const deleteStored = async (conversationId: string) => {
  await fetch(`${window.location.origin}${$apiPath}/traces/${accountType}/${accountId}/${conversationId}`, { method: 'DELETE', credentials: 'include' })
  await fetchStored()
}
```

(Import `$apiPath` from `~/context` as other pages do; call `fetchStored()` inside the existing admin branch of `onMounted`.)

  - Add a list UI in the left pane above the `<trace-view>`: a `v-list` of `stored` rows showing `preview` + `userName` + `startedAt`, each with a load action (click) and a delete icon-button calling `deleteStored`.

- [ ] **Step 2: Type-check + lint**

Run: `npm run check-types && npm run lint-fix`
Expected: PASS.

- [ ] **Step 3: Extend the e2e test**

Add a test (in `tests/features/traces/trace-review.e2e.spec.ts`, new file following the existing trace-review e2e pattern):
  - As admin: enable `storeTraces`, chat one turn through the gateway with consent header so a trace is stored (reuse the api helper approach or drive the chat UI then accept consent).
  - Navigate to `/{type}/{id}/trace-review`.
  - Assert a stored conversation row appears; click it; assert `TraceView` renders entries (e.g. the `physical-request` and `user-message` entries are visible).
  - Click delete; assert the row disappears.

- [ ] **Step 4: Build packages + run e2e**

Run:
```bash
cd lib-vuetify && npm run build && cd ..
cd lib-vue && npm run build && cd ..
npm run test tests/features/traces/trace-review.e2e.spec.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "ui/src/pages/[type]/[id]/trace-review.vue" tests/features/traces/trace-review.e2e.spec.ts
git commit -m "feat(trace-review): browse, load and delete server-stored traces"
```

---

## Final verification

- [ ] **Run the whole quality gate**

Run: `npm run lint-fix && npm run check-types && npm run test`
Expected: all green.

- [ ] **Docker build**

Run: `docker build -t agents .`
Expected: succeeds.

- [ ] **Manual smoke (optional)**

Enable `storeTraces` in Settings for an org, chat as a member, accept consent, then open the admin trace-review page and confirm the conversation loads and renders. Toggle consent off in chat settings and confirm new turns stop being stored.

---

## Notes for the implementer

- **Recording must never break chat.** All recording paths are wrapped in `try/catch` and fired without `await` in the request handler. Do not change this.
- **The first turn before consent is intentionally not stored.** Don't try to backfill it.
- **`crypto.randomUUID()`** is available in the browser (used already for provider ids) and in Node for the gateway.
- **TTL:** Mongo's TTL monitor runs ~every 60s; tests must not depend on TTL deletion timing — they assert on `expiresAt` being set, not on expiry.
- **i18n:** every new user-facing string needs both `en` and `fr` (project convention).
- **Anonymous sessions:** `usageUserId` is `anon:<hash>` and `usageUserName` is undefined — the doc will store the anon id and no name; that's expected.
