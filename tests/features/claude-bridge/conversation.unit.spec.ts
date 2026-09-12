/**
 * stateless unit tests for the claude-bridge Conversation turn machine.
 *
 * These exist because of a specific hazard: the SDK yields the assistant message
 * BEFORE invoking the tool handler, so any design that looks for tool calls inside
 * the stream loop blocks forever. The first test here is that regression.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { Conversation, type SdkMessage } from '../../../dev/claude-bridge/conversation.ts'

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
