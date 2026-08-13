import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { formatMcpToolResult, isMediaToolResult, redactMediaToolResult, redactHistoryMediaToolResults } from '../../../ui/src/utils/tool-result.ts'

const PNG = 'iVBORw0KGgoAAAANSUhEUg=='

test.describe('formatMcpToolResult (unit)', () => {
  test('joins text content parts', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'line 1' }, { type: 'text', text: 'line 2' }] })
    assert.equal(out, 'line 1\nline 2')
  })

  test('ignores unknown content parts', () => {
    const out = formatMcpToolResult({ content: [{ type: 'resource' }, { type: 'text', text: 'kept' }] as any })
    assert.equal(out, 'kept')
  })

  test('returns a media envelope when the result contains an image part', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'a chart' }, { type: 'image', data: PNG, mimeType: 'image/png' }] })
    assert.notEqual(typeof out, 'string')
    assert.ok(isMediaToolResult(out))
    if (isMediaToolResult(out)) {
      assert.equal(out.text, 'a chart')
      assert.deepEqual(out.media, [{ data: PNG, mediaType: 'image/png' }])
    }
  })

  test('image-only result produces an envelope without text', () => {
    const out = formatMcpToolResult({ content: [{ type: 'image', data: PNG, mimeType: 'image/jpeg' }] })
    assert.ok(isMediaToolResult(out))
    if (isMediaToolResult(out)) {
      assert.equal(out.text, undefined)
      assert.equal(out.media[0].mediaType, 'image/jpeg')
    }
  })

  test('an image part without data is ignored rather than emitting a broken envelope', () => {
    const out = formatMcpToolResult({ content: [{ type: 'image' }, { type: 'text', text: 'kept' }] as any })
    assert.equal(out, 'kept')
  })

  test('an MCP error with an image keeps the failure prefix in the envelope text', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'boom' }, { type: 'image', data: PNG, mimeType: 'image/png' }], isError: true })
    assert.ok(isMediaToolResult(out))
    if (isMediaToolResult(out)) assert.match(out.text ?? '', /^Tool execution failed: boom/)
  })

  test('falls back to the serialized result when there is no content', () => {
    const out = formatMcpToolResult({})
    assert.equal(out, '{}')
  })

  test('surfaces an MCP error so the model sees the failure', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'boom' }], isError: true })
    assert.match(out as string, /^Tool execution failed: /)
    assert.match(out as string, /boom/)
  })

  test('marks an error even when it carried no text body', () => {
    const out = formatMcpToolResult({ isError: true })
    assert.match(out as string, /Tool execution failed: /)
  })
})

test.describe('media redaction (unit)', () => {
  test('redactMediaToolResult replaces base64 data with a size placeholder', () => {
    const redacted = redactMediaToolResult({ _agentsMediaResult: true, text: 'a chart', media: [{ data: PNG, mediaType: 'image/png' }] })
    assert.ok(isMediaToolResult(redacted))
    if (isMediaToolResult(redacted)) {
      assert.equal(redacted.text, 'a chart')
      assert.notEqual(redacted.media[0].data, PNG)
      assert.match(redacted.media[0].data, /image\/png/)
      assert.match(redacted.media[0].data, /omitted/)
    }
  })

  test('redactMediaToolResult leaves non-envelope values untouched', () => {
    assert.equal(redactMediaToolResult('plain text'), 'plain text')
    const obj = { rows: [1, 2, 3] }
    assert.equal(redactMediaToolResult(obj), obj)
  })

  test('redactHistoryMediaToolResults redacts envelopes inside tool-result parts without mutating the input', () => {
    const envelope = { _agentsMediaResult: true, media: [{ data: PNG, mediaType: 'image/png' }] }
    const history = [
      { role: 'user', content: 'show me' },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'c1', toolName: 'snap', output: { type: 'json', value: envelope } }] }
    ] as any[]
    const redacted = redactHistoryMediaToolResults(history)
    const out = (redacted[1].content as any[])[0].output.value
    assert.match(out.media[0].data, /omitted/)
    // input untouched
    assert.equal(envelope.media[0].data, PNG)
    // unrelated messages pass through by reference
    assert.equal(redacted[0], history[0])
  })
})
