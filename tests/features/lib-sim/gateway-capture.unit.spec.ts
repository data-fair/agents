import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { summariseRequest } from '../../../lib-sim/gateway-capture.ts'

test.describe('gateway capture', () => {
  test('records the tools the page actually registered', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [
        { type: 'function', function: { name: 'get_schema' } },
        { type: 'function', function: { name: 'query_data' } }
      ]
    })
    assert.deepEqual(ex?.toolNames, ['get_schema', 'query_data'])
  })

  test('records the tool calls the assistant made', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [
        { role: 'user', content: 'worst station?' },
        { role: 'assistant', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'query_data', arguments: '{"aggregation":"avg"}' } }] }
      ]
    })
    assert.deepEqual(ex?.toolCalls, [{ name: 'query_data', arguments: '{"aggregation":"avg"}' }])
  })

  test('records the last user message so a turn can be located in the transcript', () => {
    const ex = summariseRequest({ model: 'assistant', messages: [{ role: 'user', content: 'first' }, { role: 'assistant', content: 'ok' }, { role: 'user', content: 'second' }] })
    assert.equal(ex?.lastUserMessage, 'second')
    assert.equal(ex?.messageCount, 3)
  })

  test('extracts text from multi-part user message content arrays', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'find' },
          { type: 'image_url', image_url: { url: 'http://example.com/img.jpg' } },
          { type: 'text', text: 'by schema' }
        ]
      }]
    })
    assert.equal(ex?.lastUserMessage, 'find by schema')
  })

  test('falls back to JSON stringified content when array has no text parts', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: 'http://example.com/img.jpg' } }
        ]
      }]
    })
    assert(ex?.lastUserMessage.startsWith('['))
    assert(ex?.lastUserMessage.includes('image_url'))
  })

  test('ignores a body that is not a chat completion request', () => {
    assert.equal(summariseRequest({ nope: true }), null)
    assert.equal(summariseRequest('not json'), null)
  })
})

test.describe('host blocks', () => {
  // The blocks the application injects land in tool results and in the hidden
  // context of a user message, neither of which the summary keeps. Measuring
  // them here, where the whole body is still in hand, is the only chance: this
  // is what the new host-events mechanism costs the conversation.
  test('counts the characters of every host block in the request', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [
        { role: 'user', content: '<host-state>\nlocation: /datasets\n</host-state>\n\nbonjour' },
        { role: 'tool', content: '{"ok":true}\n\n<host-events>\n- wizard: step 2\n</host-events>' }
      ]
    })
    assert.equal(
      ex?.hostBlockChars,
      '<host-state>\nlocation: /datasets\n</host-state>'.length +
      '<host-events>\n- wizard: step 2\n</host-events>'.length
    )
  })

  test('is zero for a conversation the application never annotated', () => {
    const ex = summariseRequest({ model: 'assistant', messages: [{ role: 'user', content: 'bonjour' }] })
    assert.equal(ex?.hostBlockChars, 0)
  })

  test('ignores an unterminated block rather than swallowing the rest of the message', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{ role: 'user', content: '<host-state>\ntruncated, no close tag, then a long tail' }]
    })
    assert.equal(ex?.hostBlockChars, 0)
  })
})

test.describe('tool results', () => {
  // Without these a judge can only see what the assistant ASKED a tool, never
  // what came back — so "the form data is valid and saved" was unfalsifiable in
  // a recorded run. They live in the request body as role:"tool" messages and
  // were simply being discarded.
  test('records what each tool returned, paired with the call that asked', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [
        { role: 'user', content: 'fill the form' },
        { role: 'assistant', tool_calls: [{ id: 'c1', function: { name: 'setData', arguments: '{"name":"Marie"}' } }] },
        { role: 'tool', tool_call_id: 'c1', content: '{"ok":true,"saved":false}' }
      ]
    })
    assert.deepEqual(ex?.toolResults, [{ id: 'c1', name: 'setData', result: '{"ok":true,"saved":false}' }])
  })

  test('still records a result whose call it cannot pair, rather than dropping it', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{ role: 'tool', tool_call_id: 'orphan', content: 'done' }]
    })
    assert.deepEqual(ex?.toolResults, [{ id: 'orphan', name: '', result: 'done' }])
  })

  test('caps a large result so one tool cannot swallow the evidence file', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{ role: 'tool', tool_call_id: 'c1', content: 'x'.repeat(5000) }]
    })
    assert.ok(ex!.toolResults[0].result.length < 5000)
    assert.ok(ex!.toolResults[0].result.endsWith('…[truncated]'))
  })

  test('renders a structured result rather than recording [object Object]', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{ role: 'tool', tool_call_id: 'c1', content: [{ type: 'text', text: 'ST-002 18.7' }] }]
    })
    assert.ok(ex!.toolResults[0].result.includes('ST-002 18.7'))
  })

  test('is empty for a request in which no tool has answered yet', () => {
    const ex = summariseRequest({ model: 'assistant', messages: [{ role: 'user', content: 'hi' }] })
    assert.deepEqual(ex?.toolResults, [])
  })
})
