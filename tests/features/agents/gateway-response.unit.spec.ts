/**
 * Unit tests for the gateway-response parser.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { parseGatewayCompletion } from '../../../ui/src/traces/gateway-response.ts'

test.describe('parseGatewayCompletion', () => {
  test('reassembles a streaming text completion + usage', () => {
    const sse = [
      'data: {"choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"content":"Hel"},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"content":"lo"},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":100,"completion_tokens":5,"total_tokens":105}}', '',
      'data: [DONE]', ''
    ].join('\n')
    const { result, usage } = parseGatewayCompletion(sse)
    assert.equal(result.content, 'Hello')
    assert.equal(result.finishReason, 'stop')
    assert.equal(result.toolCalls.length, 0)
    assert.deepEqual(usage, { inputTokens: 100, outputTokens: 5 })
  })

  test('reassembles streaming tool calls', () => {
    const sse = [
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"search","arguments":""}}]},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"q\\":"}}]},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"x\\"}"}}]},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":30,"completion_tokens":10,"total_tokens":40}}', '',
      'data: [DONE]', ''
    ].join('\n')
    const { result, usage } = parseGatewayCompletion(sse)
    assert.equal(result.toolCalls.length, 1)
    assert.equal(result.toolCalls[0].id, 'call_1')
    assert.equal(result.toolCalls[0].name, 'search')
    assert.equal(result.toolCalls[0].arguments, '{"q":"x"}')
    assert.equal(result.finishReason, 'tool_calls')
    assert.deepEqual(usage, { inputTokens: 30, outputTokens: 10 })
  })

  test('parses a non-streaming JSON completion (compaction path)', () => {
    const json = JSON.stringify({
      id: 'chatcmpl-1',
      object: 'chat.completion',
      created: 1,
      model: 'summarizer',
      choices: [{ index: 0, message: { role: 'assistant', content: 'summary text' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 50, completion_tokens: 8, total_tokens: 58 }
    })
    const { result, usage } = parseGatewayCompletion(json)
    assert.equal(result.content, 'summary text')
    assert.equal(result.finishReason, 'stop')
    assert.deepEqual(usage, { inputTokens: 50, outputTokens: 8 })
  })

  test('returns zeros on unparseable input rather than throwing', () => {
    const { result, usage } = parseGatewayCompletion('not json, not sse')
    assert.equal(result.content, '')
    assert.deepEqual(usage, { inputTokens: 0, outputTokens: 0 })
  })
})
