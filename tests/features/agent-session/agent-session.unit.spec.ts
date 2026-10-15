/**
 * stateless unit tests for the agent session: the wire protocol, and the dispatch that owns
 * correlation and timeouts.
 *
 * No socket, no port, no dev stack — session.ts takes a `send` function precisely so that the
 * behaviour worth testing (what a dropped connection does to a call in flight, what an unknown callId
 * does) is reachable here rather than only through a browser.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { parseClientMessage, parseServerMessageForClient, isAgentSessionPath, isSupersededFrame, CLIENT_FRAME_LIMITS, TOOLS_MESSAGE } from '@agents/shared/agent-session-protocol'
import { createAgentSession, BROWSER_CALL_TIMEOUT_MS, DELTA_FLUSH_MS } from '../../../api/src/agent-session/session.ts'
import type { ServerMessage } from '@agents/shared/agent-session-protocol'

const parse = (value: unknown) => parseClientMessage(JSON.stringify(value))

/** A session with a captured outbox and a timer we control, so a timeout is tested without waiting. */
const harness = (over: { callTimeoutMs?: number } = {}) => {
  const sent: ServerMessage[] = []
  const prompts: string[] = []
  const attaches: Array<string | undefined> = []
  let aborts = 0
  const timers: Array<{ fn: () => void, ms: number, cleared: boolean }> = []
  const session = createAgentSession({
    send: message => { sent.push(message) },
    onPrompt: content => { prompts.push(content) },
    onAbort: () => { aborts++ },
    onAttach: conversationId => { attaches.push(conversationId) },
    ...over,
    setTimer: (fn, ms) => { timers.push({ fn, ms, cleared: false }); return timers.length - 1 },
    clearTimer: handle => { timers[handle as number].cleared = true }
  })
  return {
    session,
    sent,
    prompts,
    attaches,
    timers,
    aborts: () => aborts,
    /** Fire the timer of the n-th outstanding call. */
    fireTimer: (index = 0) => { timers[index].fn() },
    last: () => sent[sent.length - 1]
  }
}

const hello = (names: string[] = ['select_row']) => ({
  type: 'hello' as const,
  tools: names.map(name => ({ name, description: `the ${name} tool` }))
})

test.describe('parseClientMessage', () => {
  test('accepts a hello with tools and echoes the optional ids', () => {
    assert.deepEqual(parse({ type: 'hello', tools: [{ name: 'select_row' }], conversationId: 'c1' }), {
      type: 'hello', tools: [{ name: 'select_row' }], conversationId: 'c1'
    })
  })

  test('an anonymous hello carries the account and the action token', () => {
    assert.deepEqual(parse({ type: 'hello', tools: [], account: { type: 'organization', id: 'o1', extra: 1 }, anonymousToken: 't' }), {
      type: 'hello', tools: [], account: { type: 'organization', id: 'o1' }, anonymousToken: 't'
    })
  })

  test('a hello starting a thread carries the consent answer the browser holds; its first prompt carries the title', () => {
    assert.deepEqual(parse({ type: 'hello', tools: [], account: { type: 'user', id: 'u1' }, agentId: 'portal-assistant', reviewConsent: true }), {
      type: 'hello', tools: [], account: { type: 'user', id: 'u1' }, agentId: 'portal-assistant', reviewConsent: true
    })
    assert.deepEqual(parse({ type: 'hello', tools: [], reviewConsent: false }), { type: 'hello', tools: [], reviewConsent: false })
    // Strictly boolean: a truthy string must not read as consent.
    assert.equal(parse({ type: 'hello', tools: [], reviewConsent: 'yes' }).type, 'invalid')
    // The title is stamped when the first message is sent, so it travels with that prompt.
    assert.deepEqual(parse({ type: 'prompt', content: 'go', title: 'Mine' }), { type: 'prompt', content: 'go', title: 'Mine' })
    assert.equal(parse({ type: 'prompt', content: 'go', title: 42 }).type, 'invalid')
  })

  test('a malformed account or token is refused rather than ignored', () => {
    assert.equal(parse({ type: 'hello', tools: [], account: { type: 'department', id: 'x' } }).type, 'invalid')
    assert.equal(parse({ type: 'hello', tools: [], account: { type: 'user', id: '' } }).type, 'invalid')
    assert.equal(parse({ type: 'hello', tools: [], account: null }).type, 'invalid')
    assert.equal(parse({ type: 'hello', tools: [], anonymousToken: 42 }).type, 'invalid')
  })

  test('accepts an approval decision, with or without a reason', () => {
    assert.deepEqual(parse({ type: 'approval', approvalId: 'a1', approved: true }), { type: 'approval', approvalId: 'a1', approved: true })
    assert.deepEqual(parse({ type: 'approval', approvalId: 'a1', approved: false, reason: 'not today', extra: 1 }), {
      type: 'approval', approvalId: 'a1', approved: false, reason: 'not today'
    })
    assert.deepEqual(parse({ type: 'approval', approvalId: 'a1', approved: false, reason: 'x'.repeat(1000) }).type, 'approval')
  })

  test('refuses a malformed approval decision', () => {
    // Strictly boolean: a truthy string must not read as an approval.
    assert.equal(parse({ type: 'approval', approvalId: 'a1', approved: 'yes' }).type, 'invalid')
    assert.equal(parse({ type: 'approval', approvalId: 'a1' }).type, 'invalid')
    assert.equal(parse({ type: 'approval', approved: true }).type, 'invalid')
    assert.equal(parse({ type: 'approval', approvalId: '', approved: true }).type, 'invalid')
    assert.equal(parse({ type: 'approval', approvalId: 'a1', approved: false, reason: 'x'.repeat(1001) }).type, 'invalid')
    assert.equal(parse({ type: 'approval', approvalId: 'a1', approved: false, reason: 42 }).type, 'invalid')
  })

  test('refuses anything that is not valid JSON, or not an object', () => {
    assert.deepEqual(parseClientMessage('{nope'), { type: 'invalid', reason: 'not valid JSON' })
    assert.equal(parseClientMessage('[]').type, 'invalid')
    assert.equal(parseClientMessage('"hello"').type, 'invalid')
  })

  test('a refusal names the field that was wrong', () => {
    // The schema's custom messages: what the client is told, so a malformed frame is debuggable.
    const reason = (value: unknown) => (parse(value) as { reason: string }).reason
    assert.match(TOOLS_MESSAGE, /^tools must be an array of at most \d+ \{ name, description\?, inputSchema\? \} with unique names matching/)
    assert.equal(reason({ type: 'hello', tools: [{ name: 'select row' }] }), TOOLS_MESSAGE)
    assert.equal(reason({ type: 'hello', tools: [{ name: 'x' }, { name: 'x' }] }), TOOLS_MESSAGE)
    assert.equal(reason({ type: 'hello', tools: [], account: null }), 'account must be { type: "user" | "organization", id } when present')
    assert.match(reason({ type: 'prompt', content: '   ' }), /^content must be a non-blank string/)
    assert.equal(reason({ type: 'tool-result', callId: 'c' }), 'a tool-result carries exactly one of result or error')
    const eventReason = `at most ${CLIENT_FRAME_LIMITS.events} events, each with a non-empty name and a numeric at; detail (at most ${CLIENT_FRAME_LIMITS.eventDetail} characters) and key must be strings when present`
    assert.equal(reason({ type: 'host-events', events: [{ name: '', at: 1 }] }), eventReason)
    assert.equal(reason({ type: 'host-events', events: [{ name: 'saved', at: 1, detail: 3 }] }), eventReason)
    assert.equal(reason({ type: 'host-events', events: [{ name: 'saved', at: 1, key: {} }] }), eventReason)
    assert.equal(reason({ type: 'approval', approvalId: 'a1', approved: false, reason: 'x'.repeat(1001) }), 'reason must be a string of at most 1000 characters')
    assert.equal(reason([]), 'a message must be an object')
  })

  test('refuses an unknown type, and says which', () => {
    const result = parse({ type: 'subscribe', channel: 'x' })
    assert.equal(result.type, 'invalid')
    assert.match((result as { reason: string }).reason, /unknown message type "subscribe"/)
  })

  test('a tool name is constrained, because it becomes a model-facing identifier', () => {
    assert.equal(parse({ type: 'hello', tools: [{ name: 'select row' }] }).type, 'invalid')
    assert.equal(parse({ type: 'hello', tools: [{ name: '' }] }).type, 'invalid')
    assert.equal(parse({ type: 'hello', tools: [{ name: 'a'.repeat(65) }] }).type, 'invalid')
    assert.equal(parse({ type: 'hello', tools: [{ name: 'a'.repeat(64) }] }).type, 'hello')
  })

  test('a duplicate tool name is refused', () => {
    // It would make the correlation table ambiguous and hand the model two tools it cannot tell apart.
    assert.equal(parse({ type: 'hello', tools: [{ name: 'x' }, { name: 'x' }] }).type, 'invalid')
  })

  test('a blank prompt is refused rather than started', () => {
    assert.equal(parse({ type: 'prompt', content: '   ' }).type, 'invalid')
    assert.equal(parse({ type: 'prompt', content: 'go' }).type, 'prompt')
  })

  test('a tool-result carries exactly one of result or error', () => {
    assert.equal(parse({ type: 'tool-result', callId: 'c', result: 1, error: 'boom' }).type, 'invalid')
    assert.equal(parse({ type: 'tool-result', callId: 'c' }).type, 'invalid')
    assert.equal(parse({ type: 'tool-result', callId: 'c', result: 1 }).type, 'tool-result')
    assert.equal(parse({ type: 'tool-result', callId: 'c', error: 'boom' }).type, 'tool-result')
    // A falsy result is still a result — `undefined` is the only absence.
    assert.equal(parse({ type: 'tool-result', callId: 'c', result: null }).type, 'tool-result')
    assert.equal(parse({ type: 'tool-result', callId: 'c', result: false }).type, 'tool-result')
  })
})

test.describe('parseClientMessage — bounded', () => {
  // A browser-facing surface states its sizes: without them one frame could carry a 100 MiB prompt
  // (ws's default payload cap) or thousands of tools, all of it folded into a model call.
  const long = (n: number) => 'x'.repeat(n)

  test('a prompt, its hidden context and its title have a size', () => {
    assert.equal(parse({ type: 'prompt', content: long(CLIENT_FRAME_LIMITS.prompt) }).type, 'prompt')
    assert.equal(parse({ type: 'prompt', content: long(CLIENT_FRAME_LIMITS.prompt + 1) }).type, 'invalid')
    assert.equal(parse({ type: 'prompt', content: 'go', hiddenContext: long(CLIENT_FRAME_LIMITS.hiddenContext + 1) }).type, 'invalid')
    assert.equal(parse({ type: 'prompt', content: 'go', title: long(CLIENT_FRAME_LIMITS.title + 1) }).type, 'invalid')
  })

  test('a page declares a bounded number of tools, each with a bounded description', () => {
    const many = Array.from({ length: CLIENT_FRAME_LIMITS.tools + 1 }, (_, i) => ({ name: `t${i}` }))
    assert.equal(parse({ type: 'hello', tools: many }).type, 'invalid')
    assert.equal(parse({ type: 'tools-changed', tools: many }).type, 'invalid')
    assert.equal(parse({ type: 'hello', tools: [{ name: 't', description: long(CLIENT_FRAME_LIMITS.toolDescription + 1) }] }).type, 'invalid')
  })

  test('host events come in bounded batches of bounded events', () => {
    const event = { name: 'clicked', at: 1 }
    assert.equal(parse({ type: 'host-events', events: Array(CLIENT_FRAME_LIMITS.events + 1).fill(event) }).type, 'invalid')
    assert.equal(parse({ type: 'host-events', events: [{ ...event, detail: long(CLIENT_FRAME_LIMITS.eventDetail + 1) }] }).type, 'invalid')
    assert.equal(parse({ type: 'host-events', events: [{ ...event, detail: long(CLIENT_FRAME_LIMITS.eventDetail) }] }).type, 'host-events')
  })

  test('identifiers and a tool error are short strings', () => {
    assert.equal(parse({ type: 'hello', tools: [], conversationId: long(CLIENT_FRAME_LIMITS.id + 1) }).type, 'invalid')
    assert.equal(parse({ type: 'approval', approvalId: long(CLIENT_FRAME_LIMITS.id + 1), approved: true }).type, 'invalid')
    assert.equal(parse({ type: 'tool-result', callId: 'c', error: long(CLIENT_FRAME_LIMITS.toolError + 1) }).type, 'invalid')
  })
})

test.describe('isSupersededFrame — what a backlogged socket may skip', () => {
  // A frame the next one replaces whole can be skipped when the browser is not reading fast enough;
  // one that says something nothing later repeats cannot.
  test('an in-progress message or sub-agent transcript and a delta are superseded by the final message', () => {
    assert.equal(isSupersededFrame({ type: 'message', seq: 2, role: 'assistant', parts: [], pending: true }), true)
    assert.equal(isSupersededFrame({ type: 'subagent', parentToolCallId: 'c', name: 'n', parts: [], pending: true }), true)
    assert.equal(isSupersededFrame({ type: 'delta', kind: 'text', text: 'hi' }), true)
  })

  test('a final message, a call to the page, an activity, the turn end and an error are never skipped', () => {
    // An activity is not repeated: a 'waiting' or 'approval' line sent as a turn ends would be lost.
    assert.equal(isSupersededFrame({ type: 'activity', activity: null }), false)
    assert.equal(isSupersededFrame({ type: 'message', seq: 2, role: 'assistant', parts: [], pending: false }), false)
    assert.equal(isSupersededFrame({ type: 'subagent', parentToolCallId: 'c', name: 'n', parts: [], pending: false }), false)
    assert.equal(isSupersededFrame({ type: 'tool-call', callId: 'c', name: 'n', input: {} }), false)
    assert.equal(isSupersededFrame({ type: 'turn-end', stopReason: 'completed' }), false)
    assert.equal(isSupersededFrame({ type: 'error', status: 403, message: 'no' }), false)
  })
})

test.describe('parseServerMessageForClient — lenient, on purpose', () => {
  // The mirror image of parseClientMessage, and deliberately the opposite posture. The server refuses
  // what it does not recognise from a browser; the browser IGNORES what it does not recognise from the
  // server, because that means a newer server talking to an older tab — normal during a deploy, where
  // failing hard would break the whole session to protect against one unknown frame.
  const parseServer = (value: unknown) => parseServerMessageForClient(JSON.stringify(value))

  test('accepts every frame the server actually sends', () => {
    assert.deepEqual(parseServer({ type: 'attached', conversationId: 'c1', anonymous: false, reviewOffered: false }), { type: 'attached', conversationId: 'c1', anonymous: false, reviewOffered: false })
    // Bound to nothing yet: the next prompt creates the thread.
    assert.deepEqual(parseServer({ type: 'attached', anonymous: false, reviewOffered: false }), { type: 'attached', anonymous: false, reviewOffered: false })
    assert.deepEqual(parseServer({ type: 'delta', kind: 'text', text: 'hi' }), { type: 'delta', kind: 'text', text: 'hi' })
    assert.deepEqual(parseServer({ type: 'tool-call', callId: 'c', name: 'n', input: { a: 1 } }), { type: 'tool-call', callId: 'c', name: 'n', input: { a: 1 } })
    assert.deepEqual(parseServer({ type: 'turn-end', stopReason: 'completed' }), { type: 'turn-end', stopReason: 'completed' })
    assert.deepEqual(parseServer({ type: 'error', status: 403, message: 'nope' }), { type: 'error', status: 403, message: 'nope' })
  })

  test('ignores an unknown frame rather than throwing', () => {
    assert.equal(parseServer({ type: 'something-added-later', payload: 1 }), undefined)
    assert.equal(parseServerMessageForClient('{not json'), undefined)
    assert.equal(parseServerMessageForClient('[]'), undefined)
  })

  test('a tool-call with no input is still a call', () => {
    // A zero-argument page tool is normal, and `input: undefined` must not look like a broken frame.
    assert.deepEqual(parseServer({ type: 'tool-call', callId: 'c', name: 'refresh' }), { type: 'tool-call', callId: 'c', name: 'refresh' })
  })
})

test.describe('isAgentSessionPath', () => {
  test('matches on the suffix, so a deployment prefix does not change the answer', () => {
    // The upgrade reaches the HTTP server before Express, so req.url carries whatever public prefix the
    // reverse proxy was configured with. Anchoring on the dev prefix would work here and fail in
    // production for an invisible reason.
    assert.equal(isAgentSessionPath('/agents/api/agent-session'), true)
    assert.equal(isAgentSessionPath('/api/agent-session'), true)
    assert.equal(isAgentSessionPath('/some/other/mount/api/agent-session?x=1'), true)
    assert.equal(isAgentSessionPath('/agents/api/agent-session/'), true)
  })

  test('does not match the pub/sub endpoint or a near miss', () => {
    assert.equal(isAgentSessionPath('/agents/api/'), false)
    assert.equal(isAgentSessionPath('/agents/api/agent-sessions'), false)
    assert.equal(isAgentSessionPath('/agents/api/agent-session/extra'), false)
    assert.equal(isAgentSessionPath(undefined), false)
  })
})

test.describe('the session', () => {
  test('hello attaches and reports the conversation back', () => {
    const h = harness()
    h.session.handle({ ...hello(), conversationId: 'c1' })
    assert.equal(h.session.attached(), true)
    // reviewOffered: whether this account stores traces, which is what makes the chat ask the person
    // for consent. Always present so a client never has to distinguish absent from false.
    assert.deepEqual(h.last(), { type: 'attached', conversationId: 'c1', anonymous: false, reviewOffered: false })
    assert.deepEqual(h.session.tools().map(t => t.name), ['select_row'])
  })

  test('a hello without a conversation binds to nothing, and the thread its first prompt created is bound and named', () => {
    const h = harness()
    h.session.handle(hello())
    assert.deepEqual(h.last(), { type: 'attached', anonymous: false, reviewOffered: false })
    assert.deepEqual(h.attaches, [undefined])
    // The prompt is not refused for want of a thread: creating it is what the first prompt does.
    h.session.handle({ type: 'prompt', content: 'go' })
    assert.deepEqual(h.prompts, ['go'])
    h.session.bind('c9')
    assert.deepEqual(h.last(), { type: 'attached', conversationId: 'c9', anonymous: false, reviewOffered: false })
    assert.deepEqual(h.attaches, [undefined, 'c9'])
  })

  test('the consent is what the browser says: in the hello, then in a review-consent frame', () => {
    const h = harness()
    assert.equal(h.session.reviewConsent(), false, 'no answer is no consent')
    h.session.handle({ ...hello(), reviewConsent: true })
    assert.equal(h.session.reviewConsent(), true)
    h.session.handle({ type: 'review-consent', consented: false })
    assert.equal(h.session.reviewConsent(), false)
    h.session.handle({ type: 'review-consent', consented: true })
    // A hello that says nothing leaves the answer as it was.
    h.session.handle(hello())
    assert.equal(h.session.reviewConsent(), true)
  })

  test('a prompt before hello is refused, not queued', () => {
    const h = harness()
    h.session.handle({ type: 'prompt', content: 'go' })
    assert.deepEqual(h.prompts, [])
    assert.deepEqual(h.last(), { type: 'error', status: 400, message: 'say hello before prompting' })
  })

  test('tools-changed replaces the set wholesale, as a navigation does', () => {
    const h = harness()
    h.session.handle(hello(['a', 'b']))
    h.session.handle({ type: 'tools-changed', tools: [{ name: 'c' }] })
    assert.deepEqual(h.session.tools().map(t => t.name), ['c'])
  })

  test('calling a browser tool asks the page and resolves with its answer', async () => {
    const h = harness()
    h.session.handle(hello())
    const call = h.session.callBrowserTool('select_row', { id: 7 })
    const asked = h.last() as { type: 'tool-call', callId: string, name: string, input: unknown }
    assert.equal(asked.type, 'tool-call')
    assert.equal(asked.name, 'select_row')
    assert.deepEqual(asked.input, { id: 7 })
    h.session.handle({ type: 'tool-result', callId: asked.callId, result: 'row 7 selected' })
    assert.equal(await call, 'row 7 selected')
    assert.equal(h.timers[0].cleared, true, 'the timeout must be cleared, or it fires after the answer')
  })

  test('a browser-reported failure rejects, rather than resolving with an error-shaped value', async () => {
    // The distinction this codebase has already been bitten by: a failure that arrives as a value is
    // indistinguishable from a result.
    const h = harness()
    h.session.handle(hello())
    const call = h.session.callBrowserTool('select_row', {})
    const asked = h.last() as { callId: string }
    h.session.handle({ type: 'tool-result', callId: asked.callId, error: 'no such row' })
    await assert.rejects(call, /no such row/)
  })

  test('a call the page never answers times out, rather than hanging the turn', async () => {
    const h = harness({ callTimeoutMs: 1234 })
    h.session.handle(hello())
    const call = h.session.callBrowserTool('select_row', {})
    assert.equal(h.timers[0].ms, 1234)
    h.fireTimer()
    await assert.rejects(call, /did not answer select_row within 1234ms/)
  })

  test('closing the connection fails every call in flight', async () => {
    // The person on the other end is the only thing that could have answered, so a pending call must
    // not outlive the socket — it would hold the turn open until the run deadline.
    const h = harness()
    h.session.handle(hello(['a', 'b']))
    const first = h.session.callBrowserTool('a', {})
    const second = h.session.callBrowserTool('b', {})
    h.session.close('the connection closed')
    await assert.rejects(first, /closed before a answered/)
    await assert.rejects(second, /closed before b answered/)
    assert.equal(h.session.attached(), false)
  })

  test('a call after close is refused immediately', async () => {
    const h = harness()
    h.session.handle(hello())
    h.session.close('gone')
    await assert.rejects(h.session.callBrowserTool('select_row', {}), /session is closed \(gone\)/)
  })

  test('a tool the page does not offer fails here, not at the browser', async () => {
    // A model can invent a name, and a navigation can remove a tool between the model's decision and
    // this call. Either way the browser would never answer.
    const h = harness()
    h.session.handle(hello(['select_row']))
    await assert.rejects(h.session.callBrowserTool('drop_database', {}), /does not offer a tool named drop_database/)
  })

  test('an answer for an unknown callId is reported rather than swallowed', () => {
    const h = harness()
    h.session.handle(hello())
    h.session.handle({ type: 'tool-result', callId: 'never-issued', result: 1 })
    assert.match((h.last() as { message: string }).message, /no tool call is waiting for callId never-issued/)
    assert.equal((h.last() as { status: number }).status, 404)
  })

  test('a late answer, after the timeout fired, does not resolve anything', async () => {
    const h = harness()
    h.session.handle(hello())
    const call = h.session.callBrowserTool('select_row', {})
    const asked = h.last() as { callId: string }
    h.fireTimer()
    await assert.rejects(call)
    h.session.handle({ type: 'tool-result', callId: asked.callId, result: 'too late' })
    assert.match((h.last() as { message: string }).message, /no tool call is waiting/)
  })

  test('abort reaches the loop', () => {
    const h = harness()
    h.session.handle(hello())
    h.session.handle({ type: 'abort' })
    assert.equal(h.aborts(), 1)
  })

  test('the default call timeout is well under a run deadline', () => {
    // Otherwise it could never fire before the whole-turn ceiling and would be decoration — the same
    // reasoning the stream idle watchdog is held to.
    assert.ok(BROWSER_CALL_TIMEOUT_MS < 300_000)
    assert.equal(BROWSER_CALL_TIMEOUT_MS, 30_000)
  })
})

test.describe('delta batching', () => {
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  test('consecutive deltas go out as one frame, within the flush window', async () => {
    const h = harness()
    h.session.send({ type: 'delta', kind: 'text', text: 'wor' })
    h.session.send({ type: 'delta', kind: 'text', text: 'ld' })
    assert.equal(h.sent.length, 0)
    await wait(DELTA_FLUSH_MS + 20)
    assert.deepEqual(h.sent, [{ type: 'delta', kind: 'text', text: 'world' }])
  })

  test('any other frame flushes the pending delta first, so the order is kept', () => {
    const h = harness()
    h.session.send({ type: 'delta', kind: 'text', text: 'before' })
    h.session.send({ type: 'turn-end', stopReason: 'completed' })
    assert.deepEqual(h.sent.map(m => m.type), ['delta', 'turn-end'])
  })

  test('a change of kind is a boundary: reasoning and text are never merged', () => {
    const h = harness()
    h.session.send({ type: 'delta', kind: 'reasoning', text: 'thinking' })
    h.session.send({ type: 'delta', kind: 'text', text: 'answer' })
    h.session.send({ type: 'turn-end', stopReason: 'completed' })
    assert.deepEqual(h.sent, [
      { type: 'delta', kind: 'reasoning', text: 'thinking' },
      { type: 'delta', kind: 'text', text: 'answer' },
      { type: 'turn-end', stopReason: 'completed' }
    ])
  })

  test('a frame the session sends itself keeps the order too', () => {
    const h = harness()
    h.session.handle(hello(['select_row']))
    h.session.send({ type: 'delta', kind: 'text', text: 'before the call' })
    h.session.callBrowserTool('select_row', {}).catch(() => {})
    assert.deepEqual(h.sent.map(m => m.type), ['attached', 'delta', 'tool-call'])
  })

  test('nothing is sent after the session closes', async () => {
    const h = harness()
    h.session.send({ type: 'delta', kind: 'text', text: 'lost' })
    h.session.close('gone')
    await wait(DELTA_FLUSH_MS + 20)
    assert.equal(h.sent.length, 0)
  })
})
