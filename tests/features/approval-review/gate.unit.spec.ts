/**
 * The review gate: the one `toolApproval` function deciding each tool call of a configured agent's turn
 * (docs/superpowers/specs/2026-11-03-auto-approval-design.md, "The routing"). Pure: the review is a parameter.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import type { ModelMessage } from 'ai'
import { createReviewGate, type GateTool } from '../../../api/src/approval-review/gate.ts'
import { exposureOf, type Exposure, type ProposedCall, type ReviewRecord } from '../../../api/src/approval-review/operations.ts'
import { TOOL_NO_LONGER_AVAILABLE } from '../../../api/src/conversations/approved-calls.ts'
import { recapMessage } from '../../../api/src/conversations/compaction-prompt.ts'

const record = (outcome: ReviewRecord['outcome'], over: Partial<ReviewRecord> = {}): ReviewRecord =>
  ({ outcome, reason: 'r', code: 'judged', exposed: false, at: '2026-11-03T00:00:00.000Z', ...over })

const reviewed = (route: 'reviewer' | 'reviewer+person', cls: 'write' | 'destructive' = 'write'): GateTool =>
  ({ annotations: cls === 'destructive' ? { destructiveHint: true } : {}, server: 'dev', review: { route, cls, kind: 'action' } })

const fakeReview = (answer: ReviewRecord | (() => ReviewRecord)) => {
  const calls: Array<{ call: ProposedCall, exposure: Exposure }> = []
  return {
    calls,
    review: async (call: ProposedCall, exposure: Exposure) => {
      calls.push({ call, exposure })
      return typeof answer === 'function' ? answer() : answer
    }
  }
}

const gateWith = (opts: {
  tools: Record<string, GateTool>
  answer?: ReviewRecord
  surface?: 'chat' | 'task'
  history?: ModelMessage[]
  exposure?: (messages: ModelMessage[]) => Exposure
}) => {
  const fake = fakeReview(opts.answer ?? record('allow'))
  const gate = createReviewGate({
    tools: () => opts.tools,
    history: opts.history ?? [],
    surface: opts.surface ?? 'chat',
    review: fake.review,
    exposure: opts.exposure ?? (() => ({ exposed: false, tools: [] }))
  })
  return { gate, fake }
}

const decide = (gate: ReturnType<typeof createReviewGate>, toolName: string, opts: { toolCallId?: string, messages?: ModelMessage[], input?: unknown } = {}) => {
  const approve = gate.toolApproval as (options: any) => Promise<unknown>
  return approve({
    toolCall: { type: 'tool-call', toolCallId: opts.toolCallId ?? 'c1', toolName, input: opts.input ?? {} },
    tools: {},
    toolsContext: {},
    runtimeContext: {},
    messages: opts.messages ?? [{ role: 'user', content: 'do it' }]
  })
}

const asked = (toolName: string, toolCallId: string): ModelMessage => ({
  role: 'assistant',
  content: [
    { type: 'tool-call', toolCallId, toolName, input: {} },
    { type: 'tool-approval-request', approvalId: `appr-${toolCallId}`, toolCallId }
  ]
} as ModelMessage)
const approved = (toolCallId: string): ModelMessage =>
  ({ role: 'tool', content: [{ type: 'tool-approval-response', approvalId: `appr-${toolCallId}`, approved: true }] }) as ModelMessage

test.describe('review gate (unit)', () => {
  test('gate: a reviewer-routed allow is approved, without a card', async () => {
    const { gate, fake } = gateWith({ tools: { set_note: reviewed('reviewer') } })
    assert.deepEqual(await decide(gate, 'set_note', { input: { note: 'n' } }), { type: 'approved', reason: 'r' })
    assert.equal(fake.calls.length, 1)
    assert.deepEqual(fake.calls[0].call, { toolName: 'set_note', server: 'dev', annotations: {}, input: { note: 'n' }, cls: 'write', kind: 'action' })
  })

  test('gate: a cleared allow carries no reason', async () => {
    const { gate } = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('allow', { reason: '', code: 'cleared' }) })
    assert.deepEqual(await decide(gate, 'set_note'), { type: 'approved' })
  })

  test('gate: a reviewer+person allow asks the person, with the reviewer\'s reason', async () => {
    const { gate } = gateWith({ tools: { delete_note: reviewed('reviewer+person', 'destructive') } })
    assert.deepEqual(await decide(gate, 'delete_note'), { type: 'user-approval', reason: 'r' })
  })

  test('gate: a deny is denied, whatever the route', async () => {
    for (const route of ['reviewer', 'reviewer+person'] as const) {
      for (const surface of ['chat', 'task'] as const) {
        const { gate } = gateWith({ tools: { set_note: reviewed(route) }, answer: record('deny'), surface })
        assert.deepEqual(await decide(gate, 'set_note'), { type: 'denied', reason: 'r' })
      }
    }
  })

  test('gate: unsure asks in a chat and denies in a task', async () => {
    const chat = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure') })
    assert.deepEqual(await decide(chat.gate, 'set_note'), { type: 'user-approval', reason: 'r' })
    const task = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure'), surface: 'task' })
    assert.deepEqual(await decide(task.gate, 'set_note'), { type: 'denied', reason: 'r' })
  })

  test('gate: an unreviewed tool with needsApproval asks', async () => {
    const { gate, fake } = gateWith({ tools: { request_web_access: { needsApproval: true }, fill_form: { needsApproval: true } } })
    assert.deepEqual(await decide(gate, 'request_web_access'), { type: 'user-approval' })
    assert.deepEqual(await decide(gate, 'fill_form', { toolCallId: 'c2' }), { type: 'user-approval' })
    assert.equal(fake.calls.length, 0)
  })

  test('gate: an unreviewed tool without needsApproval is not applicable', async () => {
    const { gate, fake } = gateWith({ tools: { list_road_closures: { annotations: { readOnlyHint: true } } } })
    assert.deepEqual(await decide(gate, 'list_road_closures'), { type: 'not-applicable' })
    assert.equal(fake.calls.length, 0)
  })

  test('gate: a call the person already approved is not reviewed again', async () => {
    const messages: ModelMessage[] = [{ role: 'user', content: 'delete the note' }, asked('delete_note', 'c1'), approved('c1')]
    const { gate, fake } = gateWith({ tools: { delete_note: reviewed('reviewer+person', 'destructive') }, history: messages })
    const status = await decide(gate, 'delete_note', { messages }) as { type: string }
    assert.notEqual(status.type, 'denied')
    assert.equal(fake.calls.length, 0)
  })

  test('gate: a person-approved replay is exactly user-approval', async () => {
    const messages: ModelMessage[] = [{ role: 'user', content: 'delete the note' }, asked('delete_note', 'c1'), approved('c1')]
    const { gate } = gateWith({ tools: { delete_note: reviewed('reviewer+person', 'destructive') }, history: messages })
    assert.deepEqual(await decide(gate, 'delete_note', { messages }), { type: 'user-approval' })
  })

  test('gate: a call asked about but not answered is reviewed', async () => {
    const messages: ModelMessage[] = [{ role: 'user', content: 'delete the note' }, asked('delete_note', 'c1')]
    const { gate, fake } = gateWith({ tools: { delete_note: reviewed('reviewer+person', 'destructive') }, history: messages })
    await decide(gate, 'delete_note', { messages })
    assert.equal(fake.calls.length, 1)
  })

  test('gate: a call the person declined is reviewed, not taken as approved', async () => {
    const declined = { role: 'tool', content: [{ type: 'tool-approval-response', approvalId: 'appr-c1', approved: false }] } as ModelMessage
    const messages: ModelMessage[] = [{ role: 'user', content: 'delete the note' }, asked('delete_note', 'c1'), declined]
    const { gate, fake } = gateWith({ tools: { delete_note: reviewed('reviewer+person', 'destructive') }, history: messages })
    await decide(gate, 'delete_note', { messages })
    assert.equal(fake.calls.length, 1)
  })

  test('gate: a failed review neither counts towards the breaker nor resets its streak', async () => {
    const answers = [record('deny'), record('deny'), record('unsure', { code: 'review-failed', failure: 'error' }), record('deny')]
    const fake = fakeReview(() => answers.shift()!)
    const gate = createReviewGate({ tools: () => ({ set_note: reviewed('reviewer') }), history: [], surface: 'chat', review: fake.review, exposure: () => ({ exposed: false, tools: [] }) })
    for (const id of ['c1', 'c2', 'c3']) await decide(gate, 'set_note', { toolCallId: id })
    assert.equal(gate.tripped, false)
    await decide(gate, 'set_note', { toolCallId: 'c4' })
    assert.equal(gate.tripped, true)
  })

  test('gate: an approved call whose tool is gone is denied as no longer available', async () => {
    const messages: ModelMessage[] = [{ role: 'user', content: 'delete the note' }, asked('delete_note', 'c1'), approved('c1')]
    const { gate, fake } = gateWith({ tools: {}, history: messages })
    assert.deepEqual(await decide(gate, 'delete_note', { messages }), { type: 'denied', reason: TOOL_NO_LONGER_AVAILABLE })
    assert.equal(fake.calls.length, 0)
  })

  test('gate: three judged denials trip the breaker', async () => {
    const { gate } = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('deny') })
    await decide(gate, 'set_note', { toolCallId: 'c1' })
    await decide(gate, 'set_note', { toolCallId: 'c2' })
    assert.equal(gate.tripped, false)
    await decide(gate, 'set_note', { toolCallId: 'c3' })
    assert.equal(gate.tripped, true)
  })

  test('gate: recordOf returns the record of a reviewed call', async () => {
    const answer = record('allow', { reason: 'within the request' })
    const { gate } = gateWith({ tools: { set_note: reviewed('reviewer') }, answer })
    await decide(gate, 'set_note', { toolCallId: 'c7' })
    assert.deepEqual(gate.recordOf('c7'), answer)
    assert.equal(gate.recordOf('c8'), undefined)
  })

  test('gate: the review is given the exposure of the step\'s messages', async () => {
    const seen: ModelMessage[][] = []
    const { gate, fake } = gateWith({
      tools: { set_note: reviewed('reviewer') },
      exposure: messages => { seen.push(messages); return { exposed: true, tools: ['fetch_url'] } }
    })
    const messages: ModelMessage[] = [{ role: 'user', content: 'note it' }]
    await decide(gate, 'set_note', { messages })
    assert.equal(seen[0], messages)
    assert.deepEqual(fake.calls[0].exposure, { exposed: true, tools: ['fetch_url'] })
  })

  // Task 2 carry-over: the compaction recap, as the loop's history starts with it (turn-history.ts) and the SDK
  // hands it on unchanged in toolApproval's `messages` (loopGuardPrepareStep: initialMessages, then the step's).
  test('gate: a history starting with the compaction recap is exposed', async () => {
    const tools = { set_note: reviewed('reviewer') }
    const { gate, fake } = gateWith({ tools, exposure: messages => exposureOf(messages, tools, { webhookPayloads: false }) })
    const messages: ModelMessage[] = [
      recapMessage('The person asked for a list of closures; list_road_closures returned three.'),
      { role: 'user', content: 'note the first one' },
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'set_note', input: { note: 'D383' } }] }
    ]
    await decide(gate, 'set_note', { messages })
    assert.deepEqual(fake.calls[0].exposure, { exposed: true, tools: [] })
  })

  test('gate: a nested call is reviewed against the latest step\'s messages and earlier scanned nested calls', async () => {
    const tools: Record<string, GateTool> = {
      set_note: reviewed('reviewer'),
      list_road_closures: { annotations: { readOnlyHint: true } },
      get_schema: { annotations: { readOnlyHint: true, openWorldHint: false } }
    }
    const seen: ModelMessage[][] = []
    const { gate, fake } = gateWith({ tools, exposure: messages => { seen.push(messages); return { exposed: false, tools: [] } } })
    const messages: ModelMessage[] = [{ role: 'user', content: 'run the script' }]
    await decide(gate, 'code_mode', { toolCallId: 'script', messages })

    gate.noteNested('get_schema')
    const first = await gate.reviewNested('n1', 'set_note', { note: 'a' })
    assert.equal(seen.at(-1), messages)
    assert.deepEqual(fake.calls[0].exposure, { exposed: false, tools: [] })
    assert.equal(gate.recordOf('n1'), first)

    gate.noteNested('list_road_closures')
    await gate.reviewNested('n2', 'set_note', { note: 'b' })
    assert.deepEqual(fake.calls[1].exposure, { exposed: true, tools: ['list_road_closures'] })
    // The next step's calls carry it too: the script's own result may not name what it read.
    await decide(gate, 'set_note', { toolCallId: 'c2', messages })
    assert.deepEqual(fake.calls[2].exposure, { exposed: true, tools: ['list_road_closures'] })
  })

  test('gate: nested denials count towards the breaker', async () => {
    const { gate } = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('deny') })
    for (const id of ['n1', 'n2', 'n3']) await gate.reviewNested(id, 'set_note', {})
    assert.equal(gate.tripped, true)
  })

  test('gate: a nested call to a tool the gate does not review is refused', async () => {
    const { gate } = gateWith({ tools: { list_road_closures: { annotations: { readOnlyHint: true } } } })
    await assert.rejects(gate.reviewNested('n1', 'list_road_closures', {}))
    await assert.rejects(gate.reviewNested('n2', 'missing', {}))
  })
})
