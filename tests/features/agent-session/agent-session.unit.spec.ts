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
import { parseClientMessage, parseServerMessageForClient, isAgentSessionPath } from '@agents/shared/agent-session-protocol'
import { createAgentSession, BROWSER_CALL_TIMEOUT_MS } from '../../../api/src/agent-session/session.ts'
import type { ServerMessage } from '@agents/shared/agent-session-protocol'

const parse = (value: unknown) => parseClientMessage(JSON.stringify(value))

/** A session with a captured outbox and a timer we control, so a timeout is tested without waiting. */
const harness = (over: { callTimeoutMs?: number } = {}) => {
  const sent: ServerMessage[] = []
  const prompts: string[] = []
  let aborts = 0
  const timers: Array<{ fn: () => void, ms: number, cleared: boolean }> = []
  const session = createAgentSession({
    send: message => { sent.push(message) },
    onPrompt: content => { prompts.push(content) },
    onAbort: () => { aborts++ },
    ...over,
    setTimer: (fn, ms) => { timers.push({ fn, ms, cleared: false }); return timers.length - 1 },
    clearTimer: handle => { timers[handle as number].cleared = true }
  })
  return {
    session,
    sent,
    prompts,
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

  test('refuses anything that is not valid JSON, or not an object', () => {
    assert.deepEqual(parseClientMessage('{nope'), { type: 'invalid', reason: 'not valid JSON' })
    assert.equal(parseClientMessage('[]').type, 'invalid')
    assert.equal(parseClientMessage('"hello"').type, 'invalid')
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

test.describe('parseServerMessageForClient — lenient, on purpose', () => {
  // The mirror image of parseClientMessage, and deliberately the opposite posture. The server refuses
  // what it does not recognise from a browser; the browser IGNORES what it does not recognise from the
  // server, because that means a newer server talking to an older tab — normal during a deploy, where
  // failing hard would break the whole session to protect against one unknown frame.
  const parseServer = (value: unknown) => parseServerMessageForClient(JSON.stringify(value))

  test('accepts every frame the server actually sends', () => {
    assert.deepEqual(parseServer({ type: 'attached', conversationId: 'c1', anonymous: false }), { type: 'attached', conversationId: 'c1', anonymous: false })
    assert.deepEqual(parseServer({ type: 'delta', kind: 'text', text: 'hi' }), { type: 'delta', kind: 'text', text: 'hi' })
    assert.deepEqual(parseServer({ type: 'tool-call', callId: 'c', name: 'n', input: { a: 1 } }), { type: 'tool-call', callId: 'c', name: 'n', input: { a: 1 } })
    assert.deepEqual(parseServer({ type: 'turn-end', stopReason: 'completed' }), { type: 'turn-end', stopReason: 'completed' })
    assert.deepEqual(parseServer({ type: 'error', message: 'nope' }), { type: 'error', message: 'nope' })
  })

  test('ignores an unknown frame rather than throwing', () => {
    assert.equal(parseServer({ type: 'something-added-later', payload: 1 }), undefined)
    assert.equal(parseServerMessageForClient('{not json'), undefined)
    assert.equal(parseServerMessageForClient('[]'), undefined)
  })

  test('still refuses a frame of a KNOWN type with a broken shape', () => {
    // Lenient about vocabulary, not about structure: a `delta` with no text would otherwise append
    // `undefined` to what the user is reading.
    assert.equal(parseServer({ type: 'delta', kind: 'text' }), undefined)
    assert.equal(parseServer({ type: 'delta', kind: 'sideways', text: 'x' }), undefined)
    assert.equal(parseServer({ type: 'tool-call', callId: 'c' }), undefined)
    assert.equal(parseServer({ type: 'attached' }), undefined)
  })

  test('a tool-call with no input is still a call', () => {
    // A zero-argument page tool is normal, and `input: undefined` must not look like a broken frame.
    assert.deepEqual(parseServer({ type: 'tool-call', callId: 'c', name: 'refresh' }), { type: 'tool-call', callId: 'c', name: 'refresh', input: undefined })
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
    assert.deepEqual(h.last(), { type: 'attached', conversationId: 'c1', anonymous: false })
    assert.deepEqual(h.session.tools().map(t => t.name), ['select_row'])
  })

  test('a prompt before hello is refused, not queued', () => {
    const h = harness()
    h.session.handle({ type: 'prompt', content: 'go' })
    assert.deepEqual(h.prompts, [])
    assert.equal(h.last().type, 'error')
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
