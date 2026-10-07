# Approval Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A configured autonomous agent's tool calls are gated by an admin-set policy per annotation
class (`allow` / `approve` / `deny`); a call needing approval ends the turn, the person decides in the
chat with a button, and a new run continues — executing the call exactly once if approved.

**Architecture:** The policy is pure (`classifyTool`, `applyApprovalPolicy`) and applied to the catalog
tools when the turn is assembled: `deny` removes the tool, `approve` sets the AI SDK's `needsApproval`.
The SDK stops the turn on a `tool-approval-request`; the executor stores the call `approval-requested`
and ends the run `awaiting-approval`. A decision (socket frame or HTTP) flips the stored part atomically
and starts an `approval` run, whose replay makes the SDK execute an approved call; the executor settles
that result onto the ORIGINAL message's part (the double-execution guard). A new message from the person
rejects any pending approval, so a pending approval is always the conversation's latest step.

**Tech Stack:** AI SDK `ai` 6.0.277 (`needsApproval`, `experimental_toolApprovalSecret`, UI part states
`approval-requested` / `approval-responded` / `output-denied`), MongoDB array filters, Express, Vue 3 +
Vuetify, Playwright tests.

**Spec:** `docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md` (plan 1 of 5),
building on `docs/superpowers/specs/2026-10-01-tool-approval-gate-design.md`.

## Global Constraints

- Say "autonomous agent", never bare "agent", in prose, types, routes and UI text.
- Classes: `destructive` if `destructiveHint === true` (wins over `readOnlyHint`); `readOnly` if `readOnlyHint === true`; `write` otherwise, including a tool with no annotations.
- Defaults: `{ readOnly: 'allow', write: 'allow', destructive: 'approve' }` (the user's choice; departs from the gate design's "ships open").
- The policy applies to configured autonomous agents' CATALOG (MCP) tools only — not to the personal assistant, not to page (browser) tools, not to service tools (`wait_for_user_action`).
- `deny` removes the tool from the turn's tool set; it never refuses a call at execution time.
- Only the person whose conversation it is decides, and only while they may still instruct the autonomous agent (`assertCanInstruct`, checked in `decideAndContinue` for both paths).
- A decision is atomic: the stored part is flipped only from `approval-requested`; a second decision gets 409.
- A new message from the person rejects every pending approval of the conversation, with the reason `The person sent a new message instead of deciding.`, before the message is stored.
- Set `experimental_toolApprovalSecret` to the existing `securityKey` (`api/src/cipher/service.ts`).
- Ground truth for "did the tool run" is the MCP fixture's `invokedTools()`, never the model's text.
- Quality checks after each task: `npm run lint-fix`, `npm run check-types`.
- One stateful test run at a time (api/e2e share the dev database). Never start or stop dev processes.

## Review Focus

- An autonomous agent disabled between the request and the decision: the `approval` run is refused by the kill switch and the approved call must NOT execute. Test in Task 3.
- The gated tool no longer offered when the decision arrives (an admin removed its server, or set its class to `deny`): the replay must end the call as an error on its original part, not crash or leave it pending. Test in Task 3.
- A decision sent over a socket bound to a DIFFERENT conversation than the approval's: refused. Test in Task 3.
- A reason string of unbounded length: capped at 1000 characters by validation. Test in Task 3.
- A reloaded page while an approval is pending: the card and the "Awaiting your approval" label come back. Test in Task 4.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `api/types/autonomous-agent/schema.js` (modify) | the `approvals` property |
| `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js` (modify) | admins can write `approvals` |
| `api/types/conversation-run/schema.js` (modify) | trigger `approval`, stop reason `awaiting-approval` |
| `api/src/conversations/approval-policy.ts` (create) | pure: classes, defaults, `classifyTool`, `resolveApproval`, `applyApprovalPolicy` |
| `api/src/conversations/operations.ts` (modify) | `RunStopReason` gains `awaiting-approval` |
| `api/src/conversations/executor.ts` (modify) | apply the policy, set the secret, record the request, end the run, settle a replayed result on its original part |
| `api/src/conversations/service.ts` (modify) | stored-message writes: `settleStoredToolPart`, `decideApproval`, `rejectPendingApprovals` |
| `api/src/conversations/approvals.ts` (create) | stateful flow: decide → frame → `approval` run |
| `api/src/conversations/router.ts` (modify) | `POST …/:conversationId/approvals/:approvalId`; rejecting pending approvals on a new message |
| `api/src/agent-session/turn.ts`, `service.ts`, `session.ts` (modify) | the `approval` frame; rejecting on a new message; the label on attach |
| `shared/agent-session-protocol.ts`, `shared/agent-activity.ts` (modify) | the frame; the `approval` activity |
| `ui/src/utils/chat-message.ts`, `autonomous-agent-chat-message.ts` (modify) | invocation states `awaiting-approval` and `denied` |
| `ui/src/components/agent-chat/ApprovalCard.vue` (create) | the card |
| `ui/src/components/agent-chat/AgentChatMessages.vue`, `AgentChat.vue`, `ui/src/composables/use-session-chat.ts`, `use-agent-session.ts` (modify) | render the card, send the decision |
| `docs/architecture/autonomous-agents.md` (modify) | the gate section |

---

### Task 1: The policy

**Files:**
- Create: `api/src/conversations/approval-policy.ts`
- Modify: `api/types/autonomous-agent/schema.js`, `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js`
- Test: `tests/features/autonomous-agents/approval-policy.unit.spec.ts`

**Interfaces:**
- Produces:
  - `type ApprovalClass = 'readOnly' | 'write' | 'destructive'`
  - `type ApprovalPolicy = 'allow' | 'approve' | 'deny'`
  - `type Approvals = Partial<Record<ApprovalClass, ApprovalPolicy>>`
  - `DEFAULT_APPROVALS: Record<ApprovalClass, ApprovalPolicy>`
  - `classifyTool(annotations?: Record<string, unknown>): ApprovalClass`
  - `resolveApproval(cls: ApprovalClass, approvals?: Approvals): ApprovalPolicy`
  - `applyApprovalPolicy(tools: Record<string, Tool>, annotationsByTool: Map<string, Record<string, unknown>>, approvals?: Approvals): Record<string, Tool>`
  - autonomous agent documents gain `approvals?: Approvals`

- [ ] **Step 1: Write the failing test**

```ts
// tests/features/autonomous-agents/approval-policy.unit.spec.ts
/**
 * stateless unit tests for the approval policy: which class a tool falls in, and what the policy does
 * to the tool set the model is offered.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { classifyTool, resolveApproval, applyApprovalPolicy, DEFAULT_APPROVALS } from '../../../api/src/conversations/approval-policy.ts'

const t = () => tool({ description: 'x', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async () => 'ok' })

test.describe('classifyTool', () => {
  test('destructive wins, read-only is declared, everything else writes', () => {
    assert.equal(classifyTool({ destructiveHint: true }), 'destructive')
    assert.equal(classifyTool({ destructiveHint: true, readOnlyHint: true }), 'destructive')
    assert.equal(classifyTool({ readOnlyHint: true }), 'readOnly')
    assert.equal(classifyTool({ readOnlyHint: false }), 'write')
    // Most hand-written servers declare nothing: treating that as read-only would leave the common case ungated.
    assert.equal(classifyTool(undefined), 'write')
    assert.equal(classifyTool({}), 'write')
  })
})

test.describe('resolveApproval', () => {
  test('defaults gate destructive tools only', () => {
    assert.deepEqual(DEFAULT_APPROVALS, { readOnly: 'allow', write: 'allow', destructive: 'approve' })
    assert.equal(resolveApproval('destructive', undefined), 'approve')
    assert.equal(resolveApproval('write', undefined), 'allow')
  })

  test('an agent setting overrides one class and keeps the others\' defaults', () => {
    assert.equal(resolveApproval('write', { write: 'deny' }), 'deny')
    assert.equal(resolveApproval('destructive', { write: 'deny' }), 'approve')
    assert.equal(resolveApproval('destructive', { destructive: 'allow' }), 'allow')
  })
})

test.describe('applyApprovalPolicy', () => {
  const annotations = new Map<string, Record<string, unknown>>([
    ['wipe', { destructiveHint: true }],
    ['read', { readOnlyHint: true }]
  ])

  test('deny removes the tool, approve marks it, allow leaves it untouched', () => {
    const tools = { wipe: t(), read: t(), plain: t() }
    const gated = applyApprovalPolicy(tools, annotations, { write: 'deny' })
    assert.deepEqual(Object.keys(gated).sort(), ['read', 'wipe'])
    assert.equal((gated.wipe as any).needsApproval, true)
    assert.equal(gated.read, tools.read, 'an allowed tool is passed through as is')
  })

  test('the defaults leave a write tool alone and gate a destructive one', () => {
    const gated = applyApprovalPolicy({ wipe: t(), plain: t() }, annotations, undefined)
    assert.equal((gated.wipe as any).needsApproval, true)
    assert.equal((gated.plain as any).needsApproval, undefined)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test --project=unit tests/features/autonomous-agents/approval-policy.unit.spec.ts`
Expected: FAIL — cannot find module `approval-policy.ts`.

- [ ] **Step 3: Implement the policy**

```ts
// api/src/conversations/approval-policy.ts
/**
 * operations-style module: pure, no #mongo / #config.
 *
 * The approval policy of a configured autonomous agent: which of its catalog tools need a person's
 * approval before they run, which it may use freely, and which it never sees. Keyed on the class an MCP
 * tool declares through its annotations, so the rule keeps holding as the catalog grows — "never call
 * anything destructive without asking" is not expressible per tool name.
 */
import type { Tool } from 'ai'

export type ApprovalClass = 'readOnly' | 'write' | 'destructive'
export type ApprovalPolicy = 'allow' | 'approve' | 'deny'
export type Approvals = Partial<Record<ApprovalClass, ApprovalPolicy>>

/**
 * Destructive tools are gated out of the box; the others are not. A write gated by default would gate
 * every tool of every server that declares no annotations — most of them — and teach people to click
 * Approve without reading.
 */
export const DEFAULT_APPROVALS: Record<ApprovalClass, ApprovalPolicy> = { readOnly: 'allow', write: 'allow', destructive: 'approve' }

/** `destructiveHint` wins over a contradictory `readOnlyHint`; no annotation at all is a write. */
export const classifyTool = (annotations?: Record<string, unknown>): ApprovalClass => {
  if (annotations?.destructiveHint === true) return 'destructive'
  if (annotations?.readOnlyHint === true) return 'readOnly'
  return 'write'
}

export const resolveApproval = (cls: ApprovalClass, approvals?: Approvals): ApprovalPolicy =>
  approvals?.[cls] ?? DEFAULT_APPROVALS[cls]

/**
 * The tool set the model is offered under a policy: `deny` removes a tool (the model never spends a step
 * discovering it cannot use it), `approve` sets the AI SDK's `needsApproval` (the SDK then stops the turn
 * on a call instead of executing it), `allow` leaves the tool exactly as it was.
 */
export const applyApprovalPolicy = (
  tools: Record<string, Tool>,
  annotationsByTool: Map<string, Record<string, unknown>>,
  approvals?: Approvals
): Record<string, Tool> => {
  const gated: Record<string, Tool> = {}
  for (const [name, tool] of Object.entries(tools)) {
    const policy = resolveApproval(classifyTool(annotationsByTool.get(name)), approvals)
    if (policy === 'deny') continue
    gated[name] = policy === 'approve' ? { ...tool, needsApproval: true } : tool
  }
  return gated
}
```

- [ ] **Step 4: Add the schema property**

In `api/types/autonomous-agent/schema.js`, after `instructors` and before `enabled`, add:

```js
    approvals: {
      type: 'object',
      additionalProperties: false,
      title: 'Approvals',
      'x-i18n-title': { en: 'Approvals', fr: 'Approbations' },
      description: 'What happens when this autonomous agent calls a tool, by the kind of action the tool declares. "Approve" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.',
      'x-i18n-description': {
        en: 'What happens when this autonomous agent calls a tool, by the kind of action the tool declares. "Approve" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.',
        fr: "Ce qui se passe quand cet agent autonome appelle un outil, selon le type d'action que l'outil déclare. « Approuver » arrête le tour jusqu'à ce que la personne dans la conversation approuve l'appel ; une tâche planifiée ne reçoit jamais un tel outil. Les outils qui ne déclarent rien comptent comme écrivant."
      },
      properties: Object.fromEntries([
        ['readOnly', { en: 'Reading', fr: 'Lecture' }, 'allow'],
        ['write', { en: 'Writing', fr: 'Écriture' }, 'allow'],
        ['destructive', { en: 'Destructive', fr: 'Destruction' }, 'approve']
      ].map(([key, title, fallback]) => [key, {
        type: 'string',
        title: title.en,
        'x-i18n-title': title,
        default: fallback,
        oneOf: [
          { const: 'allow', title: 'Allow', 'x-i18n-title': { en: 'Allow', fr: 'Autoriser' } },
          { const: 'approve', title: 'Approve each call', 'x-i18n-title': { en: 'Approve each call', fr: 'Approuver chaque appel' } },
          { const: 'deny', title: 'Never offer', 'x-i18n-title': { en: 'Never offer', fr: 'Ne jamais proposer' } }
        ]
      }]))
    },
```

In `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js`, add `'approvals'` to the `@param` union of `pick` and `approvals: pick('approvals')` to `properties` (after `instructors`).

- [ ] **Step 5: Build types and run the test**

Run: `npm run build-types && npx playwright test --project=unit tests/features/autonomous-agents/approval-policy.unit.spec.ts`
Expected: PASS (5 tests). `npm run check-types` clean.

- [ ] **Step 6: Commit**

```bash
git add api/src/conversations/approval-policy.ts api/types/autonomous-agent api/doc/autonomous-agents tests/features/autonomous-agents/approval-policy.unit.spec.ts ui/src/components/vjsf
git commit -m "feat(autonomous-agents): an approval policy per tool class, destructive gated by default"
```

---

### Task 2: A gated call ends the turn

**Files:**
- Modify: `api/src/conversations/executor.ts`, `api/src/conversations/operations.ts`, `api/types/conversation-run/schema.js`, `shared/agent-activity.ts`, `api/src/agent-session/turn.ts`
- Test: `tests/features/autonomous-agents/approval-gate.api.spec.ts` (create); `tests/features/autonomous-agents/runtime.api.spec.ts` (the annotations test)

**Interfaces:**
- Consumes: `applyApprovalPolicy` (Task 1).
- Produces:
  - run `stopReason: 'awaiting-approval'` (status `done`), `RunStopReason` includes it;
  - stored part `{ type: 'dynamic-tool', state: 'approval-requested', approval: { id, signature? } }`;
  - `ChatActivity` `{ kind: 'approval', toolName: string }`, sent before `turn-end` and on attach;
  - `TurnResult.awaitingApproval?: true`.

- [ ] **Step 1: Write the failing api test**

```ts
// tests/features/autonomous-agents/approval-gate.api.spec.ts
/**
 * stateful API tests for the approval gate. Whether a tool ran is read from the MCP fixture's own
 * record of calls (`invokedTools`), never from what the model says.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const BASE = '/api/conversations/organization/test1'

export const createGatedAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Gate probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

export const awaitRun = async (runId: string) => {
  for (let i = 0; i < 120; i++) {
    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}

export const turn = async (conversationId: string, content: string) => {
  const { runId } = (await orgAdmin.post(`${BASE}/${conversationId}/messages`, { content })).data
  const run = await awaitRun(runId)
  const messages = (await orgAdmin.get(`${BASE}/${conversationId}/messages`)).data.results
  return { run, messages, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}

export const callPart = (message: any, toolName: string) =>
  message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)

test.describe('The approval gate', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a destructive call is stopped by default: the turn ends awaiting approval and nothing ran', async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run, assistant } = await turn(conv.id, 'call tool wipe_everything {}')
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'awaiting-approval')
    const part = callPart(assistant, 'wipe_everything')
    assert.equal(part.state, 'approval-requested')
    assert.ok(part.approval?.id, 'the request carries its approval id')
    assert.deepEqual(fixture.invokedTools(), [], 'the tool must not have run')
  })

  test('allow runs the call as before', async () => {
    const agent = await createGatedAgent({ approvals: { destructive: 'allow' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run } = await turn(conv.id, 'call tool wipe_everything {}')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
  })

  test('deny removes the tool from what the model is offered', async () => {
    const agent = await createGatedAgent({ approvals: { write: 'deny' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run } = await turn(conv.id, 'call tool echo {"value":"x"}')
    const offered = run.calls.flatMap((c: any) => c.toolNames ?? [])
    assert.ok(!offered.includes('echo'), 'a denied write tool is never offered')
    assert.ok(offered.includes('wipe_everything'), 'the destructive one, still on approve, is offered')
    assert.deepEqual(fixture.invokedTools(), [])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test --project=api tests/features/autonomous-agents/approval-gate.api.spec.ts`
Expected: FAIL — the first test sees `stopReason: 'completed'` and `invokedTools` `['wipe_everything']`.

- [ ] **Step 3: Extend the schema and types**

In `api/types/conversation-run/schema.js`, the trigger enum becomes `['user', 'wake', 'approval']` (comment: `'approval': a person decided on a pending approval, and the turn continues from the decision`), and the stopReason enum gains `'awaiting-approval'` after `'waiting'` (comment: `'awaiting-approval': a call needs the person's approval; the turn ends there and their decision starts the next one`).

In `api/src/conversations/operations.ts`:

```ts
export type RunStopReason = 'completed' | 'waiting' | 'awaiting-approval' | 'step-limit' | 'repeated-calls' | 'budget' | 'timeout' | 'aborted' | 'error'
```

and in `runStopReasonMessage`'s `base`, after `waiting`:

```ts
    // Never appended in practice: the approval card is what the person reads (see runTurn).
    'awaiting-approval': 'Waiting for your approval.',
```

In `shared/agent-activity.ts`, add to the union and to `activityLabelKey`:

```ts
  // A call needs the person's approval; the turn ended on it (see the approval gate).
  | { kind: 'approval', toolName: string }
```

```ts
    case 'approval': return { key: 'activityApproval', name: activity.toolName }
```

and in `ui/src/components/agent-chat/AgentChatMessages.vue` i18n: `activityApproval: "Awaiting your approval: {name}"` (en) and `activityApproval: "En attente de votre approbation : {name}"` (fr).

Run `npm run build-types`.

- [ ] **Step 4: Gate the tool set and set the secret**

In `api/src/conversations/executor.ts` `performTurn`, replace the line building the catalog tools in `const tools = {` with the policy applied first:

```ts
  // THE APPROVAL GATE, on the catalog tools of a configured autonomous agent only. The personal assistant
  // has no policy, page tools act in the person's own browser, and service tools are the loop's own.
  const catalogTools = isStandardAgentId(autonomousAgent.id)
    ? rawTools
    : applyApprovalPolicy(rawTools, annotationsByTool, autonomousAgent.approvals)
  const tools = {
    ...withProvenance(catalogTools, name => serverByTool.get(name) ?? 'unknown'),
```

Add imports: `import { applyApprovalPolicy } from './approval-policy.ts'` and `import { securityKey } from '../cipher/service.ts'`. In the `streamText({ … })` call, add:

```ts
    // Signs each approval request when it is issued and verifies it on replay, so a stored
    // `approved: true` that did not come through the decision route fails instead of executing.
    experimental_toolApprovalSecret: securityKey,
```

- [ ] **Step 5: Record the request and end the turn**

In `runModelLoop`, next to `let handover`, add `let awaitingApproval = false`. In the `for await` loop, before the `tool-result` handling, add:

```ts
      // THE GATE STOPPED A CALL. The SDK has not executed it and will not this turn; it ends the turn
      // itself (finishReason 'other'). The call part already exists (the 'tool-call' part came first):
      // it becomes `approval-requested`, carrying the id and the signature the decision must present.
      if (part.type === 'tool-approval-request') {
        const call = parts.find(p => p.type === 'dynamic-tool' && p.toolCallId === part.toolCall.toolCallId)
        if (call && call.type === 'dynamic-tool') {
          Object.assign(call, {
            state: 'approval-requested',
            approval: { id: part.approvalId, ...(part.signature ? { signature: part.signature } : {}) }
          })
          awaitingApproval = true
          sendMessageFrame(true)
          await persistStructure()
        }
        continue
      }
```

In the stop reason computation, put the gate after the handover:

```ts
  const stopReason: RunStopReason = handover
    ? 'waiting'
    : awaitingApproval
      ? 'awaiting-approval'
      : finishReason === 'tool-calls'
        ? (budgetExceeded ? 'budget' : steps >= STEP_LIMIT ? 'step-limit' : 'repeated-calls')
        : 'completed'
```

Add `awaitingApproval?: true` to `TurnResult` (comment: `The turn ended on a call needing the person's approval (stopReason 'awaiting-approval').`), and return `...(awaitingApproval ? { awaitingApproval: true } : {})` next to `...(handover ? { handover } : {})`.

In `runTurn`, the notice skip becomes:

```ts
    const notice = result.stopReason === 'completed' || result.stopReason === 'waiting' || result.stopReason === 'awaiting-approval' || result.selfExplained
```

and next to the handover's activity (before `turn-end`):

```ts
    if (result.awaitingApproval) {
      const pending = finalParts.find(p => p.type === 'dynamic-tool' && p.state === 'approval-requested')
      sessionFor(run.conversationId)?.send({ type: 'activity', activity: { kind: 'approval', toolName: pending?.type === 'dynamic-tool' ? pending.toolName : '' } })
    }
```

- [ ] **Step 6: The label on attach**

In `api/src/agent-session/turn.ts` `sendHistory`, after the loop sending stored messages and before the `liveTurnOf` block:

```ts
  // A turn that ended on an approval says so on reopening, as it did when it ended.
  const last = messages[messages.length - 1]
  const pending = last?.role === 'assistant'
    ? (last.parts ?? []).find((p: any) => p.type === 'dynamic-tool' && p.state === 'approval-requested') as { toolName?: string } | undefined
    : undefined
  if (pending) session.send({ type: 'activity', activity: { kind: 'approval', toolName: pending.toolName ?? '' } })
```

- [ ] **Step 7: Keep the annotations test ungated**

In `tests/features/autonomous-agents/runtime.api.spec.ts`, the test `"a tool's MCP annotations are recorded on the call"` creates its agent with `createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }], approvals: { destructive: 'allow' } })` — it is about recording annotations on a call that runs, and `wipe_everything` is destructive.

- [ ] **Step 8: Run the tests**

Run: `npx playwright test --project=api tests/features/autonomous-agents/approval-gate.api.spec.ts tests/features/autonomous-agents/runtime.api.spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add api shared ui/src/components/agent-chat/AgentChatMessages.vue tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): a call needing approval ends the turn, unexecuted"
```

---

### Task 3: Deciding

**Files:**
- Modify: `api/src/conversations/service.ts`, `api/src/conversations/executor.ts`, `api/src/conversations/router.ts`, `api/src/agent-session/turn.ts`, `api/src/agent-session/session.ts`, `api/src/agent-session/service.ts`, `shared/agent-session-protocol.ts`
- Create: `api/src/conversations/approvals.ts`
- Test: `tests/features/autonomous-agents/approval-gate.api.spec.ts` (extend)

**Interfaces:**
- Consumes: Task 2's stored `approval-requested` part and `awaiting-approval` stop reason.
- Produces:
  - `settleStoredToolPart(conversationId: string, toolCallId: string, settled: { state: 'output-available', output: unknown } | { state: 'output-error', errorText: string }): Promise<StoredMessage | null>`
  - `decideApproval(conversationId: string, approvalId: string, decision: { approved: boolean, reason?: string, by: { userId: string, userName?: string } }): Promise<StoredMessage | null>` — null when no pending approval has that id
  - `rejectPendingApprovals(conversationId: string, reason: string): Promise<number>`
  - `decideAndContinue(input: { conversation: Conversation, session: SessionStateAuthenticated, approvalId: string, approved: boolean, reason?: string }): Promise<{ runId: string }>` — checks the person may still instruct the autonomous agent (403), throws 409 when not pending; the caller has already checked the conversation is theirs
  - `PENDING_APPROVAL_SUPERSEDED = 'The person sent a new message instead of deciding.'`
  - client frame `{ type: 'approval', approvalId: string, approved: boolean, reason?: string }`
  - `POST /api/conversations/:type/:id/:conversationId/approvals/:approvalId` body `{ approved: boolean, reason?: string }` → `{ runId }`

- [ ] **Step 1: Write the failing tests**

Append to `tests/features/autonomous-agents/approval-gate.api.spec.ts`, inside `test.describe('The approval gate', …)`:

```ts
  const pendingApproval = async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { assistant } = await turn(conv.id, 'call tool wipe_everything {}')
    return { agent, conv, approvalId: callPart(assistant, 'wipe_everything').approval.id as string, seq: assistant.seq as number }
  }
  const decide = (conversationId: string, approvalId: string, body: any) =>
    orgAdmin.post(`${BASE}/${conversationId}/approvals/${approvalId}`, body)
  const messageAt = async (conversationId: string, seq: number) =>
    (await orgAdmin.get(`${BASE}/${conversationId}/messages`)).data.results.find((m: any) => m.seq === seq)

  test('approving runs the call exactly once, settled on its original message', async () => {
    const { conv, approvalId, seq } = await pendingApproval()
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    const run = await awaitRun(runId)
    assert.equal(run.trigger, 'approval')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-available', 'the result is settled on the call\'s own part')
    assert.equal(part.toolMetadata.decision.userId, 'test1-admin1')

    // A further turn replays an approved call WITH its result, so it must not run again.
    await turn(conv.id, 'hello')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'], 'the double-execution guard')
  })

  test('a second decision is refused, and the tool still ran once', async () => {
    const { conv, approvalId } = await pendingApproval()
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    await assert.rejects(decide(conv.id, approvalId, { approved: true }), { status: 409 })
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
  })

  test('rejecting tells the model why, and nothing runs', async () => {
    const { conv, approvalId, seq } = await pendingApproval()
    const { runId } = (await decide(conv.id, approvalId, { approved: false, reason: 'not today' })).data
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-denied')
    assert.equal(part.approval.reason, 'not today')
  })

  test('a new message rejects a pending approval before it is answered', async () => {
    const { conv, seq } = await pendingApproval()
    await turn(conv.id, 'hello')
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-denied')
    assert.equal(part.approval.reason, 'The person sent a new message instead of deciding.')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('only the person whose conversation it is decides', async () => {
    const { conv, approvalId } = await pendingApproval()
    const member = await axiosAuth('test1-user1', { org: 'test1' })
    await assert.rejects(member.post(`${BASE}/${conv.id}/approvals/${approvalId}`, { approved: true }), { status: 403 })
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('a reason is bounded', async () => {
    const { conv, approvalId } = await pendingApproval()
    await assert.rejects(decide(conv.id, approvalId, { approved: false, reason: 'x'.repeat(1001) }), { status: 400 })
  })

  test('an autonomous agent disabled before the decision does not run the approved call', async () => {
    const { agent, conv, approvalId } = await pendingApproval()
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: agent.title, persona: agent.persona, mcpServers: agent.mcpServers, enabled: false })
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), [])
  })

  // If the SDK throws on replaying an approved call whose tool is gone (rather than emitting a
  // `tool-error`), catch that in runModelLoop's stream handling and settle the part with
  // settleStoredToolPart(…, { state: 'output-error', errorText: 'this tool is no longer available' }).
  test('a tool no longer offered when approved ends as an error on its own part', async () => {
    const { agent, conv, approvalId, seq } = await pendingApproval()
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: agent.title, persona: agent.persona, mcpServers: agent.mcpServers, enabled: true, approvals: { destructive: 'deny' } })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-error')
  })
```

And a socket test, in a new `test.describe('Deciding over the socket', …)` in the same file:

```ts
import { openAgentSession } from '../../support/ws.ts'
import { directoryUrl } from '../../support/axios.ts'

test.describe('Deciding over the socket', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean(); fixture.resetInvokedTools(); await putMockSettings(admin, 'organization/test1') })

  const collectUntil = async (socket: any, done: (frames: any[]) => boolean) => {
    const frames: any[] = []
    for (let i = 0; i < 3000; i++) { frames.push(await socket.next(20_000)); if (done(frames)) return frames }
    throw new Error('never happened')
  }

  test('the frame decides; a socket bound to another conversation cannot', async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const other = (await orgAdmin.post(BASE, { agentId: agent.id, title: 'other' })).data
    const socket = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    socket.send({ type: 'hello', tools: [], conversationId: conv.id })
    await socket.next()
    socket.send({ type: 'prompt', content: 'call tool wipe_everything {}' })
    const frames = await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.ok(frames.some(f => f.type === 'activity' && f.activity?.kind === 'approval'))
    const approvalId = frames.filter(f => f.type === 'message' && f.role === 'assistant').at(-1)
      .parts.find((p: any) => p.state === 'approval-requested').approval.id

    const stranger = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    stranger.send({ type: 'hello', tools: [], conversationId: other.id })
    await stranger.next()
    stranger.send({ type: 'approval', approvalId, approved: true })
    assert.equal((await stranger.next()).type, 'error')

    socket.send({ type: 'approval', approvalId, approved: true })
    await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
    socket.close(); stranger.close()
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test --project=api tests/features/autonomous-agents/approval-gate.api.spec.ts`
Expected: FAIL — the approvals route is 404.

- [ ] **Step 3: The stored-message writes**

In `api/src/conversations/service.ts`, after `updateMessage`:

```ts
/**
 * Settle a call on the message that MADE it, when its result arrives in a later turn — an approved call
 * the SDK executes on the next run's replay. Left on the earlier message without a result, the next
 * replay would see an approved call with nothing after it and execute it again.
 */
export const settleStoredToolPart = async (
  conversationId: string,
  toolCallId: string,
  settled: { state: 'output-available', output: unknown } | { state: 'output-error', errorText: string }
): Promise<StoredMessage | null> => {
  const { version } = await bumpConversationVersion(conversationId)
  const set: Record<string, unknown> = Object.fromEntries(Object.entries(settled).map(([key, value]) => [`parts.$[p].${key}`, value]))
  return await mongo.messages.findOneAndUpdate(
    { conversationId, 'parts.toolCallId': toolCallId },
    { $set: { ...set, version, updatedAt: new Date().toISOString() } },
    { arrayFilters: [{ 'p.toolCallId': toolCallId }], returnDocument: 'after', projection: { _id: 0 } }
  )
}

/**
 * Record a decision on a pending approval, atomically: only a part still `approval-requested` flips, so
 * two decisions racing (two tabs, a double click) settle it once. Null when nothing was pending under
 * that id — already decided, or never asked.
 */
export const decideApproval = async (
  conversationId: string,
  approvalId: string,
  decision: { approved: boolean, reason?: string, by: { userId: string, userName?: string } }
): Promise<StoredMessage | null> => {
  const at = new Date().toISOString()
  const pending = { 'p.approval.id': approvalId, 'p.state': 'approval-requested' }
  if (!await mongo.messages.findOne({ conversationId, parts: { $elemMatch: { 'approval.id': approvalId, state: 'approval-requested' } } }, { projection: { _id: 1 } })) return null
  const { version } = await bumpConversationVersion(conversationId)
  return await mongo.messages.findOneAndUpdate(
    { conversationId, parts: { $elemMatch: { 'approval.id': approvalId, state: 'approval-requested' } } },
    {
      $set: {
        // Approved: `approval-responded`, which the SDK executes on replay. Rejected: `output-denied`,
        // which replays as a refusal carrying the reason, so the model is told and can react.
        'parts.$[p].state': decision.approved ? 'approval-responded' : 'output-denied',
        'parts.$[p].approval.approved': decision.approved,
        ...(decision.reason ? { 'parts.$[p].approval.reason': decision.reason } : {}),
        'parts.$[p].toolMetadata.decision': { ...decision.by, approved: decision.approved, at },
        version,
        updatedAt: at
      }
    },
    { arrayFilters: [pending], returnDocument: 'after', projection: { _id: 0 } }
  )
}

/** The reason a pending approval is rejected with when the person writes instead of deciding. */
export const PENDING_APPROVAL_SUPERSEDED = 'The person sent a new message instead of deciding.'

/**
 * Reject every pending approval of a conversation — what a new message from the person does. Keeps a
 * pending approval the conversation's latest step, so no undecided call can be compacted away or
 * approved out of order. Returns how many were rejected.
 */
export const rejectPendingApprovals = async (conversationId: string, reason: string = PENDING_APPROVAL_SUPERSEDED): Promise<number> => {
  if (!await mongo.messages.findOne({ conversationId, 'parts.state': 'approval-requested' }, { projection: { _id: 1 } })) return 0
  const { version } = await bumpConversationVersion(conversationId)
  const result = await mongo.messages.updateMany(
    { conversationId, 'parts.state': 'approval-requested' },
    {
      $set: {
        'parts.$[p].state': 'output-denied',
        'parts.$[p].approval.approved': false,
        'parts.$[p].approval.reason': reason,
        version,
        updatedAt: new Date().toISOString()
      }
    },
    { arrayFilters: [{ 'p.state': 'approval-requested' }] }
  )
  return result.modifiedCount
}
```

- [ ] **Step 4: Settle a replayed result on its original part**

In `api/src/conversations/executor.ts` `runModelLoop`, change the `tool-result` and `tool-error` branches so a result for a call not in this turn's parts goes to the stored message. Add before the stream loop:

```ts
  /**
   * A result for a call this turn did not make: an approved call from the previous turn, executed by the
   * SDK on replay. Settled on the message that made the call (see settleStoredToolPart), and the watching
   * page is sent that message again.
   */
  const settleEarlierCall = async (toolCallId: string, settled: Parameters<typeof settleStoredToolPart>[2]) => {
    const message = await settleStoredToolPart(run.conversationId, toolCallId, settled)
    if (message) watcher()?.send({ type: 'message', seq: message.seq, role: 'assistant', parts: message.parts as MessagePart[], pending: false })
  }
  const isThisTurns = (toolCallId: string) => parts.some(p => p.type === 'dynamic-tool' && p.toolCallId === toolCallId)
```

At the top of the `if (part.type === 'tool-result') {` branch, after computing `bounded`:

```ts
        if (!isThisTurns(part.toolCallId)) {
          await settleEarlierCall(part.toolCallId, { state: 'output-available', output: media ? { ...output, text: bounded.result } : bounded.result })
          continue
        }
```

and at the top of `if (part.type === 'tool-error') {`, after computing `detail`:

```ts
        if (!isThisTurns(part.toolCallId)) {
          await settleEarlierCall(part.toolCallId, { state: 'output-error', errorText: boundToolResult(detail).result })
          continue
        }
```

Import `settleStoredToolPart` from `./service.ts`.

- [ ] **Step 5: The decision flow**

```ts
// api/src/conversations/approvals.ts
/**
 * Deciding on a pending approval: the person approves or rejects a call the approval gate stopped, and the
 * turn continues from the decision. The approval gate's equivalent of ./waits.ts.
 */
import { httpError } from '@data-fair/lib-express'
import type { SessionStateAuthenticated } from '@data-fair/lib-common-types/session/index.js'
import type { Conversation } from '#types'
import type { MessagePart } from '@agents/shared/message-parts'
import { createRun, decideApproval, requireAutonomousAgent, assertCanInstruct } from './service.ts'
import { startRun } from './executor.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { getEffectiveRole } from '../auth.ts'

/**
 * Both the HTTP route and the socket come through here, so the grant is checked in ONE place: approvals
 * exist only on configured autonomous agents, and approving borrows the agent's permissions exactly as
 * instructing it does — someone whose grant was revoked since the request may not approve it. That the
 * conversation is the caller's own is the caller's check (it already holds the conversation).
 */
export const decideAndContinue = async (input: {
  conversation: Conversation
  session: SessionStateAuthenticated
  approvalId: string
  approved: boolean
  reason?: string
}): Promise<{ runId: string }> => {
  const { conversation, session } = input
  assertCanInstruct(await requireAutonomousAgent(conversation.owner, conversation.agentId), session)
  const by = { userId: session.user.id, userName: session.user.name }
  const message = await decideApproval(conversation.id, input.approvalId, {
    approved: input.approved,
    ...(input.reason ? { reason: input.reason } : {}),
    by
  })
  if (!message) throw httpError(409, 'no pending approval with this id: it was already decided, or never asked')
  const watcher = sessionFor(conversation.id)
  watcher?.send({ type: 'message', seq: message.seq, role: 'assistant', parts: message.parts as MessagePart[], pending: false })
  watcher?.send({ type: 'activity', activity: null })
  const run = await createRun({
    agentId: conversation.agentId,
    conversationId: conversation.id,
    owner: conversation.owner,
    trigger: 'approval',
    triggeredBy: by,
    triggeredByRole: getEffectiveRole(session, conversation.owner),
    status: 'running',
    startedAt: new Date().toISOString()
  })
  // Not awaited, like a prompt's: the run is followed over the socket.
  startRun(run).catch(err => console.error('an approval run failed to start', err))
  return { runId: run.id }
}
```

- [ ] **Step 6: The route, and rejecting on a new message (HTTP)**

In `api/src/conversations/router.ts`, in the message POST route, next to `await settlePendingWait(…)`:

```ts
    // A message also rejects a pending approval: the person moved on without deciding.
    await rejectPendingApprovals(conversation.id)
```

and add the route after the message POST:

```ts
router.post('/:type/:id/:conversationId/approvals/:approvalId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    assertOwnsConversation(conversation, session)
    const approved = req.body?.approved
    if (typeof approved !== 'boolean') throw httpError(400, 'approved must be a boolean')
    const reason = req.body?.reason
    if (reason !== undefined && (typeof reason !== 'string' || reason.length > 1000)) throw httpError(400, 'reason must be a string of at most 1000 characters')
    res.json(await decideAndContinue({
      conversation,
      session,
      approvalId: req.params.approvalId,
      approved,
      ...(reason ? { reason } : {})
    }))
  } catch (err) { next(err) }
})
```

Imports: `rejectPendingApprovals` from `./service.ts`, `decideAndContinue` from `./approvals.ts`.

- [ ] **Step 7: The socket frame, and rejecting on a new message (socket)**

In `shared/agent-session-protocol.ts`, add to `ClientMessage`:

```ts
  /** The person's decision on a call the approval gate stopped. `reason` is optional, at most 1000 characters. */
  | { type: 'approval', approvalId: string, approved: boolean, reason?: string }
```

and to `parseClientMessage`:

```ts
    case 'approval':
      if (typeof parsed.approvalId !== 'string' || !parsed.approvalId) return { type: 'invalid', reason: 'approvalId must be a non-empty string' }
      if (typeof parsed.approved !== 'boolean') return { type: 'invalid', reason: 'approved must be a boolean' }
      if (parsed.reason !== undefined && (typeof parsed.reason !== 'string' || parsed.reason.length > 1000)) return { type: 'invalid', reason: 'reason must be a string of at most 1000 characters' }
      return { type: 'approval', approvalId: parsed.approvalId, approved: parsed.approved, ...(parsed.reason ? { reason: parsed.reason } : {}) }
```

In `api/src/agent-session/session.ts`: add the option `onApproval?: (approvalId: string, approved: boolean, reason?: string) => void` and the case:

```ts
        case 'approval':
          options.onApproval?.(message.approvalId, message.approved, message.reason)
          return
```

In `api/src/agent-session/service.ts`, add next to `onAbort` (import `decideAndContinue` from `../conversations/approvals.ts`):

```ts
      // A decision on a call the approval gate stopped, for the conversation this socket is bound to —
      // never one named in the frame, so a socket cannot decide on someone else's thread.
      onApproval: (approvalId, approved, reason) => {
        const conversationId = boundConversationId
        if (!conversationId || !sessionState?.user) {
          send({ type: 'error', message: 'only a signed-in person decides on an approval' })
          return
        }
        const session = sessionState
        attaching.then(() => resolveOwnConversation(conversationId))
          .then(conversation => decideAndContinue({
            conversation,
            session,
            approvalId,
            approved,
            ...(reason ? { reason } : {})
          }))
          .catch((err: any) => { send({ type: 'error', message: err.message ?? 'the decision could not be recorded' }) })
      },
```

In `api/src/agent-session/turn.ts` `startSessionTurn`, next to `await settlePendingWait(…)`:

```ts
  await rejectPendingApprovals(conversation.id)
```


- [ ] **Step 8: Run the tests**

Run: `npx playwright test --project=api tests/features/autonomous-agents/approval-gate.api.spec.ts tests/features/host-events tests/features/agent-session`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add api shared tests/features/autonomous-agents/approval-gate.api.spec.ts
git commit -m "feat(autonomous-agents): deciding on an approval continues the turn, executing the call once"
```

---

### Task 4: The card in the chat

**Files:**
- Create: `ui/src/components/agent-chat/ApprovalCard.vue`
- Modify: `ui/src/utils/chat-message.ts`, `ui/src/utils/autonomous-agent-chat-message.ts`, `ui/src/components/agent-chat/AgentChatMessages.vue`, `ui/src/components/AgentChat.vue`, `ui/src/composables/use-session-chat.ts`, `ui/src/composables/use-agent-session.ts`
- Test: `tests/features/autonomous-agents/chat-message.unit.spec.ts` (extend), `tests/features/autonomous-agents/approval-gate.e2e.spec.ts` (create)

**Interfaces:**
- Consumes: the `approval` frame and activity (Tasks 2–3).
- Produces: `ChatMessage.toolInvocations[].state` gains `'awaiting-approval' | 'denied'`, plus `approvalId?: string`, `serverId?: string`; `chat.decideApproval(approvalId: string, approved: boolean, reason?: string): void`.

- [ ] **Step 1: Write the failing unit test**

Append to `tests/features/autonomous-agents/chat-message.unit.spec.ts` inside `describe('autonomousAgentMessageToChat')`:

```ts
  test('a call awaiting approval carries its approval id; a rejected one reads as denied', () => {
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      parts: [
        { type: 'dynamic-tool', toolCallId: 'a', toolName: 'wipe', state: 'approval-requested', input: {}, approval: { id: 'ap1' }, toolMetadata: { serverId: 'dev' } } as any,
        { type: 'dynamic-tool', toolCallId: 'b', toolName: 'wipe', state: 'output-denied', input: {}, approval: { id: 'ap2', approved: false } } as any
      ]
    })
    assert.equal(chat.toolInvocations?.[0].state, 'awaiting-approval')
    assert.equal(chat.toolInvocations?.[0].approvalId, 'ap1')
    assert.equal(chat.toolInvocations?.[0].serverId, 'dev')
    assert.equal(chat.toolInvocations?.[1].state, 'denied')
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test --project=unit tests/features/autonomous-agents/chat-message.unit.spec.ts`
Expected: FAIL — state is `pending`.

- [ ] **Step 3: Map the states**

In `ui/src/utils/chat-message.ts`, the invocation type becomes:

```ts
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
    state: 'pending' | 'done' | 'awaiting-approval' | 'denied'
    /** The call's arguments: what a chip is labelled from (a wait's `expecting`), and what an approval card shows. */
    input?: unknown
    /** Set while the call awaits the person's approval: what their decision names. */
    approvalId?: string
    /** The catalog server the call goes to, shown on an approval card. */
    serverId?: string
  }>
```

In `ui/src/utils/autonomous-agent-chat-message.ts`, the mapping of each call becomes:

```ts
    chat.toolInvocations = calls.map(call => ({
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      input: call.input,
      ...(call.state === 'approval-requested' ? { approvalId: call.approval.id } : {}),
      ...(typeof (call as any).toolMetadata?.serverId === 'string' ? { serverId: (call as any).toolMetadata.serverId } : {}),
      // PER CALL, not per message (see the comment above). Awaiting approval and denied are their own
      // states: the first renders as a card the person acts on, the second as a declined chip.
      state: call.state === 'approval-requested'
        ? 'awaiting-approval'
        : call.state === 'output-denied'
          ? 'denied'
          : (call.state === 'input-streaming' || call.state === 'input-available' || call.state === 'approval-responded') ? 'pending' : 'done'
    }))
```

Run the unit test: PASS.

- [ ] **Step 4: The card**

```vue
<!-- ui/src/components/agent-chat/ApprovalCard.vue -->
<template>
  <v-card
    variant="outlined"
    color="warning"
    class="my-2"
    data-testid="approval-card"
  >
    <v-card-title class="text-body-large">
      {{ t('title', { name: title }) }}
    </v-card-title>
    <v-card-subtitle v-if="serverId">
      {{ t('server', { server: serverId }) }}
    </v-card-subtitle>
    <v-card-text>
      <pre class="text-body-small approval-card__input">{{ formattedInput }}</pre>
      <v-text-field
        v-if="rejecting"
        v-model="reason"
        :label="t('reason')"
        density="compact"
        maxlength="1000"
        hide-details
        class="mt-2"
        data-testid="approval-reason"
      />
    </v-card-text>
    <v-card-actions>
      <template v-if="!rejecting">
        <v-btn
          color="success"
          variant="flat"
          data-testid="approval-approve"
          @click="$emit('decide', { approved: true })"
        >
          {{ t('approve') }}
        </v-btn>
        <v-btn
          variant="text"
          data-testid="approval-reject"
          @click="rejecting = true"
        >
          {{ t('reject') }}
        </v-btn>
      </template>
      <template v-else>
        <v-btn
          color="error"
          variant="flat"
          data-testid="approval-confirm-reject"
          @click="$emit('decide', { approved: false, ...(reason.trim() ? { reason: reason.trim() } : {}) })"
        >
          {{ t('confirmReject') }}
        </v-btn>
        <v-btn
          variant="text"
          @click="rejecting = false"
        >
          {{ t('cancel') }}
        </v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<i18n lang="yaml">
fr:
  title: "Approuver « {name} » ?"
  server: "Serveur : {server}"
  approve: Approuver
  reject: Refuser
  reason: Raison (facultative)
  confirmReject: Confirmer le refus
  cancel: Annuler
en:
  title: "Approve \"{name}\"?"
  server: "Server: {server}"
  approve: Approve
  reject: Reject
  reason: Reason (optional)
  confirmReject: Confirm rejection
  cancel: Cancel
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ title: string, input?: unknown, serverId?: string }>()
defineEmits<{ decide: [decision: { approved: boolean, reason?: string }] }>()

const { t } = useI18n()
const rejecting = ref(false)
const reason = ref('')
// The arguments as the model sent them: what the person is approving is this exact call.
const formattedInput = computed(() => JSON.stringify(props.input ?? {}, null, 2))
</script>

<style scoped>
.approval-card__input {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 240px;
  overflow: auto;
}
</style>
```

- [ ] **Step 5: Render it and send the decision**

In `AgentChatMessages.vue`, inside the `v-for="invocation in message.toolInvocations"` template, before the `<v-chip>`:

```vue
                  <approval-card
                    v-if="invocation.state === 'awaiting-approval' && invocation.approvalId"
                    :title="toolTitle(invocation.toolName)"
                    :input="invocation.input"
                    :server-id="invocation.serverId"
                    @decide="decision => emit('decide-approval', { approvalId: invocation.approvalId!, ...decision })"
                  />
```

add `v-else-if` to the chip (`v-else-if="simpleSubAgents || !invocation.toolName.startsWith('subagent_')"`), make its color `invocation.state === 'done' ? 'success' : invocation.state === 'denied' ? 'error' : 'warning'`, add `'decide-approval': [payload: { approvalId: string, approved: boolean, reason?: string }]` to `defineEmits`, import `ApprovalCard from './ApprovalCard.vue'`, and extend the activity line's condition to `(isStreaming || activity?.kind === 'waiting' || activity?.kind === 'approval') && activityLabel`.

In `use-agent-session.ts`, add:

```ts
    /** The person's decision on a call the approval gate stopped. */
    decideApproval (approvalId: string, approved: boolean, reason?: string) {
      send({ type: 'approval', approvalId, approved, ...(reason ? { reason } : {}) })
    },
```

In `use-session-chat.ts`'s returned object, add `decideApproval: (approvalId: string, approved: boolean, reason?: string) => { agent.decideApproval(approvalId, approved, reason) }`. In `AgentChat.vue`, on `<agent-chat-messages>` add `@decide-approval="d => chat.decideApproval(d.approvalId, d.approved, d.reason)"`.

- [ ] **Step 6: Write the e2e test**

```ts
// tests/features/autonomous-agents/approval-gate.e2e.spec.ts
/**
 * stateful E2E tests: the approval card in the chat, on a configured autonomous agent with the mock model
 * and the MCP fixture.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin

test.describe('Approval card', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Gate probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  const ask = async (page: any, text: string) => {
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(text)
    await page.getByTestId('agent-chat-send').click()
  }

  test('approving from the card runs the call; the card survives a reload until decided', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool wipe_everything {}')
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toContainText('Awaiting your approval')

    await page.reload()
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toContainText('Awaiting your approval')

    await page.getByTestId('approval-approve').click()
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect.poll(() => fixture.invokedTools()).toEqual(['wipe_everything'])
  })

  test('rejecting with a reason leaves a declined chip, and nothing runs', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool wipe_everything {}')
    await page.getByTestId('approval-reject').click({ timeout: 15000 })
    await page.getByTestId('approval-reason').locator('input').fill('not today')
    await page.getByTestId('approval-confirm-reject').click()
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect(page.getByTestId('tool-chip').first()).toBeVisible()
    expect(fixture.invokedTools()).toEqual([])
  })
})
```

- [ ] **Step 7: Run the tests**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npx playwright test --project=e2e tests/features/autonomous-agents/approval-gate.e2e.spec.ts`
Expected: PASS. `npm run lint-fix`, `npm run check-types` clean.

- [ ] **Step 8: Commit**

```bash
git add ui tests/features/autonomous-agents
git commit -m "feat(chat): an approval card the person approves or rejects in the chat"
```

---

### Task 5: Documentation and the full suites

**Files:**
- Modify: `docs/architecture/autonomous-agents.md`, `docs/superpowers/specs/2026-10-01-tool-approval-gate-design.md` (status line), `docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md` (the new-message rule)

- [ ] **Step 1: The architecture section**

In `docs/architecture/autonomous-agents.md`, add a section `## The approval gate` covering: the three classes and how they are derived from annotations; the per-agent `approvals` and its defaults (`destructive: 'approve'`); that it applies to catalog tools of configured autonomous agents only; `deny` removes, `approve` stops the turn (`stopReason: 'awaiting-approval'`, the call stored `approval-requested`); the decision (socket frame and HTTP route, only the conversation's person, atomic, 409 on a second one) starting an `approval` run whose replay executes an approved call, settled on its original part (the double-execution guard); a new message rejecting pending approvals, which is why no compaction guard is needed; the signed approvals (`experimental_toolApprovalSecret` = `securityKey`); the card and the "Awaiting your approval" label.

- [ ] **Step 2: The specs**

Change the gate design's status line to `**Status:** implemented (2026-10), with the changes recorded in 2026-10-07-autonomous-agent-planned-execution-design.md`. In the planned-execution spec's gate section, add a bullet: `- a new message from the person **rejects** any pending approval (reason "The person sent a new message instead of deciding."), so a pending approval is always the conversation's latest step: no undecided call can be compacted away or approved out of order, and the gate design's compaction clamp is not needed.` and remove the risk line `A pending approval sits for ever`.

- [ ] **Step 3: Run the full suites**

Run, one at a time: `npx playwright test --project=unit`, `npx playwright test --max-failures=0 --project=api`, `npx playwright test --max-failures=0 --project=e2e`.
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture/autonomous-agents.md
git add -f docs/superpowers/specs/2026-10-01-tool-approval-gate-design.md docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md
git commit -m "docs(autonomous-agents): the approval gate"
```
