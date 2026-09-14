/**
 * stateless unit tests for the claude-bridge OpenAI translation layer
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  toolNameToMcp, mcpNameToTool, extractSystemPrompt, renderTranscript,
  textChunk, toolCallsChunk, finalChunk, mapUsage, errorBody
} from '../../../lib-sim/bridge/openai.ts'
import type { OpenAIMessage } from '../../../lib-sim/bridge/openai.ts'

test.describe('tool name mapping', () => {
  test('round-trips through the mcp prefix', () => {
    assert.equal(toolNameToMcp('search_data'), 'mcp__bridge__search_data')
    assert.equal(mcpNameToTool('mcp__bridge__search_data'), 'search_data')
  })

  test('leaves an unprefixed name untouched', () => {
    assert.equal(mcpNameToTool('search_data'), 'search_data')
  })

  test('keeps underscores in the original name intact', () => {
    assert.equal(mcpNameToTool(toolNameToMcp('get_dataset_schema')), 'get_dataset_schema')
  })
})

test.describe('system prompt extraction', () => {
  test('joins every system message in order', () => {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: 'You are an assistant.' },
      { role: 'system', content: 'Answer in French.' },
      { role: 'user', content: 'hello' }
    ]
    assert.equal(extractSystemPrompt(messages), 'You are an assistant.\n\nAnswer in French.')
  })

  test('returns an empty string when there is no system message', () => {
    assert.equal(extractSystemPrompt([{ role: 'user', content: 'hello' }]), '')
  })
})

test.describe('transcript rendering', () => {
  test('omits system messages, which travel as the system prompt', () => {
    const out = renderTranscript([
      { role: 'system', content: 'be brief' },
      { role: 'user', content: 'hello' }
    ])
    assert.ok(!out.includes('be brief'))
    assert.ok(out.includes('hello'))
  })

  test('renders tool calls and their results so the model can follow them', () => {
    const messages: OpenAIMessage[] = [
      { role: 'user', content: 'weather in Paris?' },
      { role: 'assistant', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Paris"}' } }] },
      { role: 'tool', tool_call_id: 'call_1', content: '{"temp":17}' }
    ]
    const out = renderTranscript(messages)
    assert.ok(out.includes('get_weather'))
    assert.ok(out.includes('{"city":"Paris"}'))
    assert.ok(out.includes('call_1'))
    assert.ok(out.includes('{"temp":17}'))
  })
})

test.describe('SSE chunks', () => {
  test('a text chunk carries the delta and no finish reason', () => {
    const c = textChunk('id1', 'haiku', 'hi') as any
    assert.equal(c.object, 'chat.completion.chunk')
    assert.equal(c.id, 'id1')
    assert.equal(c.model, 'haiku')
    assert.equal(c.choices[0].delta.content, 'hi')
    assert.equal(c.choices[0].finish_reason, null)
  })

  test('a tool-calls chunk indexes each call', () => {
    const c = toolCallsChunk('id1', 'haiku', [
      { id: 'call_1', type: 'function', function: { name: 'a', arguments: '{}' } },
      { id: 'call_2', type: 'function', function: { name: 'b', arguments: '{}' } }
    ]) as any
    assert.equal(c.choices[0].delta.tool_calls[0].index, 0)
    assert.equal(c.choices[0].delta.tool_calls[1].index, 1)
    assert.equal(c.choices[0].delta.tool_calls[1].function.name, 'b')
  })

  test('the final chunk carries the finish reason', () => {
    const c = finalChunk('id1', 'haiku', 'tool_calls') as any
    assert.equal(c.choices[0].finish_reason, 'tool_calls')
    assert.deepEqual(c.choices[0].delta, {})
  })
})

test.describe('usage and errors', () => {
  test('maps SDK usage onto the OpenAI shape', () => {
    assert.deepEqual(mapUsage({ input_tokens: 10, output_tokens: 4 }), {
      prompt_tokens: 10, completion_tokens: 4, total_tokens: 14
    })
  })

  test('returns undefined when the SDK reported no usage', () => {
    assert.equal(mapUsage(undefined), undefined)
  })

  test('error bodies use the OpenAI error envelope', () => {
    const e = errorBody('rate limited', 'rate_limit_error') as any
    assert.equal(e.error.message, 'rate limited')
    assert.equal(e.error.type, 'rate_limit_error')
  })
})
