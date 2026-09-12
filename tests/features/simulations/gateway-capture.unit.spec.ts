import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { summariseRequest } from '../../../simulations/runner/gateway-capture.ts'

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

  test('ignores a body that is not a chat completion request', () => {
    assert.equal(summariseRequest({ nope: true }), null)
    assert.equal(summariseRequest('not json'), null)
  })
})
