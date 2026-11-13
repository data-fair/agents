/**
 * The review gate: the one `toolApproval` function deciding each tool call of a configured agent's turn
 * (docs/superpowers/specs/2026-11-03-auto-approval-design.md, "The routing"). Pure: the review is a parameter.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import type { ModelMessage } from 'ai'
import { createReviewGate, type GateTool } from '../../../api/src/approval-review/gate.ts'
import { BREAKER_TRIPPED_REASON, BUDGET_SPENT_REASON, exposureOf, intentFromConversation, reviewMessage, reviewerDenialText, reviewUnavailableText, type EarlierCall, type Exposure, type ProposedCall, type ReviewRecord } from '../../../api/src/approval-review/operations.ts'
import { TOOL_NO_LONGER_AVAILABLE } from '../../../api/src/conversations/approved-calls.ts'
import { recapMessage } from '../../../api/src/conversations/compaction-prompt.ts'

const record = (outcome: ReviewRecord['outcome'], over: Partial<ReviewRecord> = {}): ReviewRecord =>
  ({ outcome, reason: 'r', code: 'judged', exposed: false, at: '2026-11-03T00:00:00.000Z', ...over })

const reviewed = (route: 'reviewer' | 'reviewer+person', cls: 'write' | 'destructive' = 'write'): GateTool =>
  ({ annotations: cls === 'destructive' ? { destructiveHint: true } : {}, server: 'dev', review: { route, cls, kind: 'action' } })

const fakeReview = (answer: ReviewRecord | (() => ReviewRecord)) => {
  const calls: Array<{ call: ProposedCall, exposure: Exposure, earlierCalls: EarlierCall[] }> = []
  return {
    calls,
    review: async (call: ProposedCall, exposure: Exposure, earlierCalls: EarlierCall[]) => {
      calls.push({ call, exposure, earlierCalls })
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
  budgetSpent?: () => boolean
  earlier?: { calls: EarlierCall[], afterMessage: number }
}) => {
  const fake = fakeReview(opts.answer ?? record('allow'))
  const gate = createReviewGate({
    tools: () => opts.tools,
    history: opts.history ?? [],
    surface: opts.surface ?? 'chat',
    review: fake.review,
    exposure: opts.exposure ?? (() => ({ exposed: false, tools: [] })),
    ...(opts.budgetSpent ? { budgetSpent: opts.budgetSpent } : {}),
    ...(opts.earlier ? { earlier: opts.earlier } : {})
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

  test('gate: the review gets the tool\'s title, and the reviewer reads it once', async () => {
    const { gate, fake } = gateWith({ tools: { set_note: { ...reviewed('reviewer'), annotations: { title: 'Set a note' }, title: 'Set a note' } } })
    await decide(gate, 'set_note', { input: { note: 'n' } })
    assert.equal(fake.calls[0].call.title, 'Set a note')
    const message = reviewMessage({ earlierCalls: [], intent: intentFromConversation(['note it'], ''), call: fake.calls[0].call, exposure: { exposed: false, tools: [] }, nonce: 'abcdef012345' }, 2)
    assert.equal(message.split('Set a note').length - 1, 1)
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
        assert.deepEqual(await decide(gate, 'set_note'), { type: 'denied', reason: reviewerDenialText('r') })
      }
    }
  })

  test('gate: unsure asks in a chat and denies in a task', async () => {
    const chat = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure') })
    assert.deepEqual(await decide(chat.gate, 'set_note'), { type: 'user-approval', reason: 'r' })
    const task = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure'), surface: 'task' })
    assert.deepEqual(await decide(task.gate, 'set_note'), { type: 'denied', reason: reviewerDenialText('r') })
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

  test('gate: a denial tells the model the reason and not to work around it; a card keeps the reviewer\'s own words', async () => {
    const denied = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('deny', { reason: 'outside the request' }) })
    const status = await decide(denied.gate, 'set_note') as { type: string, reason: string }
    assert.equal(status.type, 'denied')
    assert.ok(status.reason.includes('outside the request'), status.reason)
    assert.ok(status.reason.includes('Do not try to reach the same outcome another way'), status.reason)
    // The record keeps the reviewer's own reason, for the person's chip.
    assert.equal(denied.gate.recordOf('c1')?.reason, 'outside the request')
    const carded = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure', { reason: 'unclear' }) })
    assert.deepEqual(await decide(carded.gate, 'set_note'), { type: 'user-approval', reason: 'unclear' })
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

  test('gate: once tripped, further reviewed calls are denied unreviewed, direct and nested', async () => {
    const { gate, fake } = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('deny') })
    for (const id of ['c1', 'c2', 'c3']) await decide(gate, 'set_note', { toolCallId: id })
    assert.equal(gate.tripped, true)
    assert.equal(fake.calls.length, 3)
    const direct = await decide(gate, 'set_note', { toolCallId: 'c4' })
    assert.deepEqual(direct, { type: 'denied', reason: reviewerDenialText(BREAKER_TRIPPED_REASON) })
    assert.equal(gate.recordOf('c4')?.code, 'breaker-tripped')
    const nested = await gate.reviewNested('cm:tool-1', 'set_note', {})
    assert.equal(nested.outcome, 'deny')
    assert.equal(nested.code, 'breaker-tripped')
    assert.equal(fake.calls.length, 3, 'the reviewer is not called again')
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

  test('gate: a failed review that denies tells the model it could not be reviewed, not that it was denied', async () => {
    const failed = record('unsure', { code: 'review-failed', failure: 'timeout', reason: 'the first stage failed: it timed out' })
    const task = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: failed, surface: 'task' })
    assert.deepEqual(await decide(task.gate, 'set_note'), { type: 'denied', reason: reviewUnavailableText() })
    // The raw failure stays on the record, for the admin.
    assert.equal(task.gate.recordOf('c1')?.reason, 'the first stage failed: it timed out')
    // A judged unsure in a task keeps the reviewer's reason.
    const unsure = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure'), surface: 'task' })
    assert.deepEqual(await decide(unsure.gate, 'set_note'), { type: 'denied', reason: reviewerDenialText('r') })
  })

  test('gate: an approval in an earlier message does not skip the review of the same call id', async () => {
    // The approval was answered by the replay that followed it: the last message is no longer a tool message.
    const messages: ModelMessage[] = [{ role: 'user', content: 'delete the note' }, asked('delete_note', 'c1'), approved('c1'), { role: 'user', content: 'again' }]
    const { gate, fake } = gateWith({ tools: { delete_note: reviewed('reviewer+person', 'destructive') } })
    await decide(gate, 'delete_note', { messages })
    assert.equal(fake.calls.length, 1)
    // Nor does one in an earlier tool message, followed by another tool message.
    const later = [...messages.slice(0, 3), { role: 'tool', content: [{ type: 'tool-approval-response', approvalId: 'appr-other', approved: true }] } as ModelMessage]
    await decide(gate, 'delete_note', { messages: later, toolCallId: 'c1' })
    assert.equal(fake.calls.length, 2)
  })

  test('gate: an unsure that denies counts towards the breaker, one that cards does not', async () => {
    const task = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure'), surface: 'task' })
    for (const id of ['c1', 'c2', 'c3']) await decide(task.gate, 'set_note', { toolCallId: id })
    assert.equal(task.gate.tripped, true)
    const nested = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure'), surface: 'task' })
    for (const id of ['n1', 'n2', 'n3']) await nested.gate.reviewNested(id, 'set_note', {})
    assert.equal(nested.gate.tripped, true)
    // In a chat a script's unsure pauses it for the person, as a direct call's cards: no denial.
    const chatNested = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure') })
    for (const id of ['n1', 'n2', 'n3']) await chatNested.gate.reviewNested(id, 'set_note', {})
    assert.equal(chatNested.gate.tripped, false)
    const chat = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('unsure') })
    for (const id of ['c1', 'c2', 'c3']) await decide(chat.gate, 'set_note', { toolCallId: id })
    assert.equal(chat.gate.tripped, false)
  })

  test('gate: a nested call once the turn\'s budget is spent is denied unreviewed', async () => {
    let spent = false
    const { gate, fake } = gateWith({ tools: { set_note: reviewed('reviewer') }, budgetSpent: () => spent })
    assert.equal((await gate.reviewNested('n1', 'set_note', {})).outcome, 'allow')
    spent = true
    const refused = await gate.reviewNested('n2', 'set_note', {})
    assert.deepEqual([refused.outcome, refused.code, refused.reason], ['deny', 'budget', BUDGET_SPENT_REASON])
    assert.equal(gate.recordOf('n2')?.code, 'budget')
    assert.equal(fake.calls.length, 1, 'the reviewer is not called once the budget is spent')
    assert.equal(gate.tripped, false, 'a budget refusal is no denial for the breaker')
  })

  test('gate: a nested call to a tool the gate does not review is refused', async () => {
    const { gate } = gateWith({ tools: { list_road_closures: { annotations: { readOnlyHint: true } } } })
    await assert.rejects(gate.reviewNested('n1', 'list_road_closures', {}))
    await assert.rejects(gate.reviewNested('n2', 'missing', {}))
  })
})

test.describe('The reviewer sees earlier calls', () => {
  const earlierDenied: EarlierCall = { toolName: 'delete_note', input: { note: 'a' }, decision: 'refused-by-reviewer', reason: 'not asked', afterMessage: 1 }

  test('each review gets the earlier turns\' calls, then this turn\'s, as decided', async () => {
    let n = 0
    const answers = [record('deny', { reason: 'no' }), record('allow')]
    const fake = fakeReview(() => answers[n++] ?? record('allow'))
    const gate = createReviewGate({
      tools: () => ({ set_note: reviewed('reviewer'), delete_note: reviewed('reviewer+person', 'destructive') }),
      history: [],
      surface: 'chat',
      review: fake.review,
      exposure: () => ({ exposed: false, tools: [] }),
      earlier: { calls: [earlierDenied], afterMessage: 2 }
    })
    await decide(gate, 'set_note', { toolCallId: 'a', input: { note: 'x' } })
    await decide(gate, 'set_note', { toolCallId: 'b', input: { note: 'y' } })
    await decide(gate, 'delete_note', { toolCallId: 'c', input: { note: 'z' } })
    assert.deepEqual(fake.calls[0].earlierCalls, [earlierDenied])
    assert.deepEqual(fake.calls[1].earlierCalls.slice(1), [{ toolName: 'set_note', input: { note: 'x' }, decision: 'refused-by-reviewer', reason: 'no', afterMessage: 2 }])
    assert.deepEqual(fake.calls[2].earlierCalls.at(-1), { toolName: 'set_note', input: { note: 'y' }, decision: 'allowed-by-reviewer', afterMessage: 2 })
  })

  test('a script\'s calls are marked, and an allow on the reviewer+person route awaits a person', async () => {
    const { gate, fake } = gateWith({ tools: { set_note: reviewed('reviewer'), delete_note: reviewed('reviewer+person', 'destructive') } })
    await gate.reviewNested('s:tool-1', 'set_note', { note: 'x' })
    // A script's reviewer+person call pauses the script: awaiting the person, as a direct one.
    await gate.reviewNested('s:tool-2', 'delete_note', { note: 'w' })
    await decide(gate, 'delete_note', { toolCallId: 'd' })
    await decide(gate, 'set_note', { toolCallId: 'e' })
    assert.deepEqual(fake.calls[1].earlierCalls, [{ toolName: 'set_note', input: { note: 'x' }, decision: 'allowed-by-reviewer', inScript: true, afterMessage: 0 }])
    const paused = fake.calls[2].earlierCalls[1]
    assert.deepEqual([paused.toolName, paused.decision, paused.inScript], ['delete_note', 'awaiting-person', true])
    assert.equal(fake.calls[3].earlierCalls[2].decision, 'awaiting-person')
  })

  test('the same call as a card left undecided goes to a person again, whatever the reviewer now says', async () => {
    const undecided: EarlierCall = { toolName: 'set_note', input: { note: 'x', tags: ['a'] }, decision: 'undecided-by-person', afterMessage: 1 }
    const { gate } = gateWith({ tools: { set_note: reviewed('reviewer') }, earlier: { calls: [undecided], afterMessage: 2 } })
    // The arguments compared as values: the model may write the keys in another order.
    assert.deepEqual(await decide(gate, 'set_note', { toolCallId: 'a', input: { tags: ['a'], note: 'x' } }), { type: 'user-approval', reason: 'r' })
    assert.equal(gate.recordOf('a')?.personAgain, true)
    // Other arguments: a new call, judged as such.
    assert.deepEqual(await decide(gate, 'set_note', { toolCallId: 'b', input: { note: 'y' } }), { type: 'approved', reason: 'r' })
    // A script's call pauses for the person the same way.
    assert.equal((await gate.reviewNested('s:tool-1', 'set_note', { note: 'x', tags: ['a'] })).personAgain, true)
  })

  test('a relaunch of an undecided card is not asked again in a task, nor when the reviewer does not allow it', async () => {
    const undecided: EarlierCall = { toolName: 'set_note', input: { note: 'x' }, decision: 'undecided-by-person', afterMessage: 1 }
    const task = gateWith({ tools: { set_note: reviewed('reviewer') }, surface: 'task', earlier: { calls: [undecided], afterMessage: 1 } })
    assert.deepEqual(await decide(task.gate, 'set_note', { input: { note: 'x' } }), { type: 'approved', reason: 'r' })
    const denied = gateWith({ tools: { set_note: reviewed('reviewer') }, answer: record('deny', { reason: 'no' }), earlier: { calls: [undecided], afterMessage: 1 } })
    assert.equal(((await decide(denied.gate, 'set_note', { input: { note: 'x' } })) as { type: string }).type, 'denied')
    assert.equal(denied.gate.recordOf('c1')?.personAgain, undefined)
  })
})
