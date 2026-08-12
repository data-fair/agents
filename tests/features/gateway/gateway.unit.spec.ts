/**
 * stateless unit tests for gateway operations - message/tool conversion
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { convertOpenAITools, convertOpenAIMessages, convertToolChoice, mapFinishReason, supportsMediaToolResults, injectMediaAsUserMessages } from '../../../api/src/gateway/operations.ts'
import type { OpenAIMessage, OpenAIToolDefinition } from '../../../api/src/gateway/operations.ts'
import { extractErrorMessage } from '../../../ui/src/utils/error.ts'

const PNG = 'iVBORw0KGgoAAAANSUhEUg=='

test.describe('Gateway operations - mapFinishReason', () => {
  test('maps tool-calls to tool_calls', () => {
    assert.equal(mapFinishReason('tool-calls'), 'tool_calls')
  })

  test('maps content-filter to content_filter', () => {
    assert.equal(mapFinishReason('content-filter'), 'content_filter')
  })

  test('passes through stop unchanged', () => {
    assert.equal(mapFinishReason('stop'), 'stop')
  })

  test('passes through length unchanged', () => {
    assert.equal(mapFinishReason('length'), 'length')
  })
})

test.describe('Gateway operations - convertOpenAITools', () => {
  test('converts function tools', () => {
    const openaiTools: OpenAIToolDefinition[] = [{
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: { type: 'object', properties: { location: { type: 'string' } } }
      }
    }]
    const result = convertOpenAITools(openaiTools)
    assert.ok(result.get_weather)
  })

  test('skips non-function tools', () => {
    const openaiTools = [{ type: 'other', function: { name: 'test' } }] as unknown as OpenAIToolDefinition[]
    const result = convertOpenAITools(openaiTools)
    assert.equal(Object.keys(result).length, 0)
  })

  test('handles empty array', () => {
    const result = convertOpenAITools([])
    assert.equal(Object.keys(result).length, 0)
  })

  test('handles tool without parameters', () => {
    const openaiTools: OpenAIToolDefinition[] = [{
      type: 'function',
      function: { name: 'no_params', description: 'No parameters needed' }
    }]
    const result = convertOpenAITools(openaiTools)
    assert.ok(result.no_params)
  })
})

test.describe('Gateway operations - convertOpenAIMessages', () => {
  test('converts user message', () => {
    const messages: OpenAIMessage[] = [{ role: 'user', content: 'hello' }]
    const result = convertOpenAIMessages(messages)
    assert.equal(result.length, 1)
    assert.equal(result[0].role, 'user')
  })

  test('skips system messages', () => {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'hello' }
    ]
    const result = convertOpenAIMessages(messages)
    assert.equal(result.length, 1)
    assert.equal(result[0].role, 'user')
  })

  test('converts assistant message with text', () => {
    const messages: OpenAIMessage[] = [{ role: 'assistant', content: 'hi there' }]
    const result = convertOpenAIMessages(messages)
    assert.equal(result.length, 1)
    assert.equal(result[0].role, 'assistant')
  })

  test('converts assistant message with tool calls', () => {
    const messages: OpenAIMessage[] = [{
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: 'call_1',
        type: 'function',
        function: { name: 'get_weather', arguments: '{"location":"Paris"}' }
      }]
    }]
    const result = convertOpenAIMessages(messages)
    assert.equal(result.length, 1)
    assert.equal(result[0].role, 'assistant')
    assert.ok(Array.isArray(result[0].content))
  })

  test('converts tool result message', () => {
    const messages: OpenAIMessage[] = [
      {
        role: 'assistant',
        content: null,
        tool_calls: [{
          id: 'call_1',
          type: 'function',
          function: { name: 'get_weather', arguments: '{}' }
        }]
      },
      {
        role: 'tool',
        content: '{"temp": 20}',
        tool_call_id: 'call_1'
      }
    ]
    const result = convertOpenAIMessages(messages)
    assert.equal(result.length, 2)
    assert.equal(result[1].role, 'tool')
    // valid JSON is typed as json, with the parsed value
    const output = (result[1].content as any)[0].output
    assert.equal(output.type, 'json')
    assert.deepEqual(output.value, { temp: 20 })
  })

  test('handles malformed JSON in tool arguments gracefully', () => {
    const messages: OpenAIMessage[] = [{
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: 'call_1',
        type: 'function',
        function: { name: 'test', arguments: 'not valid json' }
      }]
    }]
    const result = convertOpenAIMessages(messages)
    assert.equal(result.length, 1)
  })

  test('handles tool result with non-JSON content', () => {
    const messages: OpenAIMessage[] = [{
      role: 'tool',
      content: 'plain text result',
      tool_call_id: 'call_1'
    }]
    const result = convertOpenAIMessages(messages)
    assert.equal(result.length, 1)
    // non-JSON content is typed as text (not mislabeled as json), carrying the raw string
    const output = (result[0].content as any)[0].output
    assert.equal(output.type, 'text')
    assert.equal(output.value, 'plain text result')
  })

  test('decodes a media envelope tool result into content output with image parts', () => {
    const envelope = { _agentsMediaResult: true, text: 'a chart', media: [{ data: PNG, mediaType: 'image/png' }] }
    const messages: OpenAIMessage[] = [{
      role: 'tool',
      content: JSON.stringify(envelope),
      tool_call_id: 'call_1'
    }]
    const result = convertOpenAIMessages(messages)
    const output = (result[0].content as any)[0].output
    assert.equal(output.type, 'content')
    assert.deepEqual(output.value, [
      { type: 'text', text: 'a chart' },
      { type: 'image-data', data: PNG, mediaType: 'image/png' }
    ])
  })

  test('decodes a text-less media envelope into image parts only', () => {
    const envelope = { _agentsMediaResult: true, media: [{ data: PNG, mediaType: 'image/jpeg' }] }
    const messages: OpenAIMessage[] = [{ role: 'tool', content: JSON.stringify(envelope), tool_call_id: 'call_1' }]
    const output = (convertOpenAIMessages(messages)[0].content as any)[0].output
    assert.equal(output.type, 'content')
    assert.deepEqual(output.value, [{ type: 'image-data', data: PNG, mediaType: 'image/jpeg' }])
  })

  test('a near-miss envelope (marker without media array) stays plain json output', () => {
    const messages: OpenAIMessage[] = [{ role: 'tool', content: '{"_agentsMediaResult":true}', tool_call_id: 'call_1' }]
    const output = (convertOpenAIMessages(messages)[0].content as any)[0].output
    assert.equal(output.type, 'json')
  })
})

test.describe('Gateway operations - supportsMediaToolResults', () => {
  test('native providers support media tool results', () => {
    assert.equal(supportsMediaToolResults('openai'), true)
    assert.equal(supportsMediaToolResults('anthropic'), true)
    assert.equal(supportsMediaToolResults('google'), true)
    assert.equal(supportsMediaToolResults('mock'), true)
    assert.equal(supportsMediaToolResults('openai-compatible'), true)
  })

  test('chat-completions-only providers need the user-message fallback', () => {
    assert.equal(supportsMediaToolResults('scaleway'), false)
    assert.equal(supportsMediaToolResults('mistral'), false)
    assert.equal(supportsMediaToolResults('openrouter'), false)
    assert.equal(supportsMediaToolResults('ollama'), false)
    assert.equal(supportsMediaToolResults('openai-compatible', 'compatible'), false)
  })
})

test.describe('Gateway operations - injectMediaAsUserMessages', () => {
  const mediaOutput = {
    type: 'content',
    value: [
      { type: 'text', text: 'a chart' },
      { type: 'image-data', data: PNG, mediaType: 'image/png' }
    ]
  }
  const toolCallMsg = (id: string, name: string) => ({
    role: 'assistant' as const,
    content: [{ type: 'tool-call', toolCallId: id, toolName: name, input: {} }]
  })
  const toolResultMsg = (id: string, name: string, output: unknown) => ({
    role: 'tool' as const,
    content: [{ type: 'tool-result', toolCallId: id, toolName: name, output }]
  })

  test('returns messages unchanged when no media tool results are present', () => {
    const messages = [
      { role: 'user' as const, content: 'hello' },
      toolCallMsg('c1', 'get_weather'),
      toolResultMsg('c1', 'get_weather', { type: 'json', value: { temp: 20 } })
    ] as any[]
    assert.deepEqual(injectMediaAsUserMessages(messages), messages)
  })

  test('rewrites a media tool result to text and appends a user message with the image', () => {
    const messages = [
      toolCallMsg('c1', 'snapshot'),
      toolResultMsg('c1', 'snapshot', mediaOutput),
      { role: 'assistant' as const, content: 'done' }
    ] as any[]
    const result = injectMediaAsUserMessages(messages)
    assert.equal(result.length, 4)
    // tool result downgraded to text, keeping the text and signaling the attachment
    const output = (result[1].content as any)[0].output
    assert.equal(output.type, 'text')
    assert.match(output.value, /a chart/)
    assert.match(output.value, /image/i)
    // injected user message right after the tool run, before the next assistant message
    assert.equal(result[2].role, 'user')
    const parts = result[2].content as any[]
    assert.ok(parts.some(p => p.type === 'image' && p.image === PNG && p.mediaType === 'image/png'))
    assert.ok(parts.some(p => p.type === 'text' && /snapshot/.test(p.text)))
    assert.equal(result[3].role, 'assistant')
  })

  test('keeps parallel tool results of one group contiguous, injecting after the run', () => {
    const messages = [
      {
        role: 'assistant' as const,
        content: [
          { type: 'tool-call', toolCallId: 'c1', toolName: 'snapshot', input: {} },
          { type: 'tool-call', toolCallId: 'c2', toolName: 'get_weather', input: {} }
        ]
      },
      toolResultMsg('c1', 'snapshot', mediaOutput),
      toolResultMsg('c2', 'get_weather', { type: 'json', value: { temp: 20 } })
    ] as any[]
    const result = injectMediaAsUserMessages(messages)
    assert.equal(result.length, 4)
    assert.equal(result[1].role, 'tool')
    assert.equal(result[2].role, 'tool')
    assert.equal(result[3].role, 'user')
  })

  test('a media output without any image parts is left untouched', () => {
    const textOnlyContent = { type: 'content', value: [{ type: 'text', text: 'just text' }] }
    const messages = [toolResultMsg('c1', 'snap', textOnlyContent)] as any[]
    assert.deepEqual(injectMediaAsUserMessages(messages), messages)
  })
})

test.describe('Gateway operations - convertToolChoice', () => {
  test('returns undefined for undefined', () => {
    assert.equal(convertToolChoice(undefined), undefined)
  })

  test('converts none', () => {
    assert.equal(convertToolChoice('none'), 'none')
  })

  test('converts auto', () => {
    assert.equal(convertToolChoice('auto'), 'auto')
  })

  test('converts required', () => {
    assert.equal(convertToolChoice('required'), 'required')
  })

  test('converts function object', () => {
    const result = convertToolChoice({ type: 'function', function: { name: 'my_tool' } })
    assert.deepEqual(result, { type: 'tool', toolName: 'my_tool' })
  })
})

test.describe('extractErrorMessage - error chain traversal', () => {
  test('returns Unknown error for falsy input', () => {
    assert.equal(extractErrorMessage(null), 'Unknown error')
    assert.equal(extractErrorMessage(undefined), 'Unknown error')
  })

  test('returns string errors as-is', () => {
    assert.equal(extractErrorMessage('something went wrong'), 'something went wrong')
  })

  test('extracts message from data.error.message (APICallError with parsed data)', () => {
    const err = {
      message: 'API call failed',
      data: { error: { message: 'Daily token quota exceeded', type: 'rate_limit_error' } }
    }
    assert.equal(extractErrorMessage(err), 'Daily token quota exceeded')
  })

  test('extracts message from responseBody JSON', () => {
    const err = {
      message: 'API call failed',
      responseBody: JSON.stringify({ error: { message: 'Monthly token quota exceeded' } })
    }
    assert.equal(extractErrorMessage(err), 'Monthly token quota exceeded')
  })

  test('extracts message from cause chain (wrapped error)', () => {
    const inner = {
      message: 'API call failed',
      data: { error: { message: 'Daily token quota exceeded', type: 'rate_limit_error' } }
    }
    const outer = {
      message: 'No output generated. Check the stream for errors.',
      cause: inner
    }
    assert.equal(extractErrorMessage(outer), 'Daily token quota exceeded')
  })

  test('extracts message from responseBody in cause chain', () => {
    const inner = {
      message: 'API call failed',
      responseBody: JSON.stringify({ error: { message: 'Daily token quota exceeded' } })
    }
    const outer = { message: 'No output generated. Check the stream for errors.', cause: inner }
    assert.equal(extractErrorMessage(outer), 'Daily token quota exceeded')
  })

  test('handles plain-text responseBody (Express error handler)', () => {
    const inner = {
      message: 'API call failed',
      responseBody: 'You do not have permission to use this model'
    }
    const outer = { message: 'No output generated. Check the stream for errors.', cause: inner }
    assert.equal(extractErrorMessage(outer), 'You do not have permission to use this model')
  })

  test('strips dev-mode prefix from plain-text responseBody', () => {
    const err = {
      message: 'API call failed',
      responseBody: '403 - Error: You do not have permission to use this model\n    at assertRoleQuota (/app/auth.ts:58:11)'
    }
    assert.equal(extractErrorMessage(err), 'You do not have permission to use this model')
  })

  test('falls back to error.message when no structured data found', () => {
    const err = { message: 'Connection refused' }
    assert.equal(extractErrorMessage(err), 'Connection refused')
  })

  test('skips generic NoOutputGeneratedError message', () => {
    const err = { message: 'No output generated. Check the stream for errors.' }
    assert.equal(extractErrorMessage(err), 'Unknown error')
  })
})
