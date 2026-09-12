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
