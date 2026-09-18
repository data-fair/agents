/**
 * stateless unit tests for the claude-bridge Conversation turn machine.
 *
 * These exist because of a specific hazard: the SDK yields the assistant message
 * BEFORE invoking the tool handler, so any design that looks for tool calls inside
 * the stream loop blocks forever. The first test here is that regression.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { Conversation, ABORTED_TOOL_RESULT, type SdkMessage } from '../../../lib-sim/bridge/conversation.ts'

/** A stream that yields what it is given, then stays open like the SDK does while a tool is pending. */
function openStream (messages: SdkMessage[], hold: Promise<void>): AsyncIterable<SdkMessage> {
  return (async function * () {
    for (const m of messages) yield m
    await hold
  })()
}

function closedStream (messages: SdkMessage[]): AsyncIterable<SdkMessage> {
  return (async function * () { for (const m of messages) yield m })()
}

test.describe('turn ending on suspended tool calls', () => {
  test('ends the turn when a handler suspends, even though the stream never closes', async () => {
    const conv = new Conversation('k')
    const never = new Promise<void>(() => {})
    const turn = conv.beginTurn(() => {}, openStream([{ type: 'assistant', message: { content: [{ type: 'text', text: 'let me check' }] } }], never))

    // The SDK invokes the handler after yielding the assistant message.
    conv.handleToolCall('mcp__bridge__get_weather', { city: 'Paris' }).catch(() => {})

    const outcome = await turn
    assert.equal(outcome.type, 'tools')
    assert.equal(outcome.type === 'tools' && outcome.calls.length, 1)
    assert.equal(outcome.type === 'tools' && outcome.calls[0].function.name, 'get_weather')
    assert.equal(outcome.type === 'tools' && outcome.calls[0].function.arguments, '{"city":"Paris"}')
    conv.abort()
  })

  test('hands back parallel calls from one message together', async () => {
    const conv = new Conversation('k')
    const never = new Promise<void>(() => {})
    const turn = conv.beginTurn(() => {}, openStream([], never))
    conv.handleToolCall('mcp__bridge__a', {}).catch(() => {})
    conv.handleToolCall('mcp__bridge__b', {}).catch(() => {})
    const outcome = await turn
    assert.equal(outcome.type === 'tools' && outcome.calls.length, 2)
    conv.abort()
  })

  test('streams assistant text to the attached sink', async () => {
    const conv = new Conversation('k')
    const seen: string[] = []
    const never = new Promise<void>(() => {})
    const turn = conv.beginTurn(t => seen.push(t), openStream([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'one ' }, { type: 'text', text: 'two' }] } }
    ], never))
    conv.handleToolCall('mcp__bridge__a', {}).catch(() => {})
    await turn
    assert.deepEqual(seen, ['one ', 'two'])
    conv.abort()
  })
})

test.describe('turn ending on stream completion', () => {
  test('ends with done and maps usage when the query finishes', async () => {
    const conv = new Conversation('k')
    const outcome = await conv.beginTurn(() => {}, closedStream([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'hi' }] } },
      { type: 'result', subtype: 'success', usage: { input_tokens: 10, output_tokens: 4 } }
    ]))
    assert.equal(outcome.type, 'done')
    assert.deepEqual(outcome.type === 'done' && outcome.usage, { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 })
  })

  test('surfaces a non-success result as an error', async () => {
    const conv = new Conversation('k')
    const outcome = await conv.beginTurn(() => {}, closedStream([
      { type: 'result', subtype: 'error_during_execution', result: 'rate limit reached' }
    ]))
    assert.equal(outcome.type, 'error')
    assert.equal(outcome.type === 'error' && outcome.message, 'rate limit reached')
  })

  test('surfaces a thrown stream error', async () => {
    const conv = new Conversation('k')
    const boom = (async function * (): AsyncIterable<SdkMessage> { throw new Error('spawn failed') })()
    const outcome = await conv.beginTurn(() => {}, boom)
    assert.equal(outcome.type, 'error')
    assert.equal(outcome.type === 'error' && outcome.message, 'spawn failed')
  })
})

test.describe('continuation across requests', () => {
  test('delivering results resolves the suspended handler and the next turn streams on', async () => {
    const conv = new Conversation('k')
    let release!: () => void
    const hold = new Promise<void>(resolve => { release = resolve })
    const turn1 = conv.beginTurn(() => {}, openStream([], hold))

    let toolReturned: string | undefined
    conv.handleToolCall('mcp__bridge__a', {}).then(r => { toolReturned = r }).catch(() => {})

    const outcome1 = await turn1
    assert.equal(outcome1.type, 'tools')
    const ids = outcome1.type === 'tools' ? outcome1.calls.map(c => c.id) : []
    conv.handedBack(ids.length)

    assert.equal(conv.awaits(ids), true, 'the call it handed back is the one it is waiting on')

    // Next HTTP request: attach a new sink, deliver the result, let the stream finish.
    const seen: string[] = []
    const turn2 = conv.beginTurn(t => seen.push(t))
    conv.deliverToolResults([{ id: ids[0], content: '{"temp":17}' }])
    await new Promise(resolve => setTimeout(resolve, 10))
    assert.equal(toolReturned, '{"temp":17}', 'the suspended handler received the client result')
    release()

    const outcome2 = await turn2
    assert.equal(outcome2.type, 'done')
  })

  test('awaits() is false for ids this conversation never suspended on', () => {
    const conv = new Conversation('k')
    assert.equal(conv.awaits(['call_nope']), false)
    assert.equal(conv.awaits([]), false)
  })
})

/** Fail fast rather than hanging the whole suite if a turn stops settling. */
function within<T> (promise: Promise<T>, ms = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`turn did not settle within ${ms}ms`)), ms)
      if (t.unref) t.unref()
    })
  ])
}

test.describe('a query that dies between two requests', () => {
  test('records the terminal outcome and replays it on the next turn', async () => {
    // Regression, and the likeliest failure of this workflow: turn 1 hands back a
    // tool call (so the session stays alive and no resolver is attached), then the
    // upstream query dies — rate limit, crash, auth failure. The error used to be
    // swallowed by `resolve?.()` and the next request awaited forever.
    const conv = new Conversation('k')
    let explode!: (err: Error) => void
    const boom = new Promise<void>((_resolve, reject) => { explode = reject })
    const stream = (async function * (): AsyncIterable<SdkMessage> { await boom })()

    const turn1 = conv.beginTurn(() => {}, stream)
    conv.handleToolCall('mcp__bridge__a', {}).catch(() => {})
    const outcome1 = await within(turn1)
    assert.equal(outcome1.type, 'tools')
    conv.handedBack(1)

    // The query dies while the client is computing the tool result.
    explode(new Error('rate limit reached'))
    await new Promise(resolve => setTimeout(resolve, 10))

    assert.equal(conv.isDead, true, 'a dead query must be observable')
    assert.equal(conv.awaits(outcome1.type === 'tools' ? outcome1.calls.map(c => c.id) : []), false,
      'a dead conversation must fail the continuation guard so the server replays instead')

    const outcome2 = await within(conv.beginTurn(() => {}))
    assert.equal(outcome2.type, 'error')
    assert.equal(outcome2.type === 'error' && outcome2.message, 'rate limit reached')
  })
})

test.describe('a tool call arriving after the turn closed', () => {
  test('is handed back by the next beginTurn instead of sitting forever', async () => {
    // The settle timer fires while no response is attached, so #endTurn is a no-op
    // and no timer is re-armed. Without the beginTurn sweep the SDK would wait for
    // a tool_result that never comes.
    const conv = new Conversation('k')
    const never = new Promise<void>(() => {})
    const turn1 = conv.beginTurn(() => {}, openStream([], never))
    conv.handleToolCall('mcp__bridge__a', {}).catch(() => {})
    const outcome1 = await within(turn1)
    assert.equal(outcome1.type, 'tools')
    conv.handedBack(1)

    // Turn closed. A second call lands and its settle timer fires with nothing attached.
    conv.handleToolCall('mcp__bridge__b', {}).catch(() => {})
    await new Promise(resolve => setTimeout(resolve, 80))

    const outcome2 = await within(conv.beginTurn(() => {}))
    assert.equal(outcome2.type, 'tools')
    assert.equal(outcome2.type === 'tools' && outcome2.calls.length, 1)
    assert.equal(outcome2.type === 'tools' && outcome2.calls[0].function.name, 'b')
    conv.abort()
  })
})

test.describe('abort', () => {
  test('answers suspended handlers with an unmistakable error, never a plausible result', async () => {
    // The model reads this string as the tool's result: a bare "aborted" would be
    // taken for a successful answer and reasoned about as data.
    const conv = new Conversation('k')
    const never = new Promise<void>(() => {})
    const turn = conv.beginTurn(() => {}, openStream([], never))
    const call = conv.handleToolCall('mcp__bridge__a', {})
    await within(turn)
    conv.abort()
    const result = await within(call)
    assert.equal(result, ABORTED_TOOL_RESULT)
    assert.match(result, /error/i)
    assert.match(result, /abort/i)
  })

  test('marks the conversation dead so it is never adopted again', () => {
    const conv = new Conversation('k')
    conv.abort()
    assert.equal(conv.isDead, true)
    assert.equal(conv.signal.aborted, true)
  })
})

test.describe('the tool set a live query was built with', () => {
  test('is remembered on the conversation', () => {
    assert.deepEqual(new Conversation('k', ['a', 'b']).toolNames, ['a', 'b'])
    assert.deepEqual(new Conversation('k').toolNames, [])
  })
})
