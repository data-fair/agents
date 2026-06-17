import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { formatMcpToolResult } from '../../../ui/src/utils/tool-result.ts'

test.describe('formatMcpToolResult (unit)', () => {
  test('joins text content parts', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'line 1' }, { type: 'text', text: 'line 2' }] })
    assert.equal(out, 'line 1\nline 2')
  })

  test('ignores non-text content parts', () => {
    const out = formatMcpToolResult({ content: [{ type: 'image' }, { type: 'text', text: 'kept' }] as any })
    assert.equal(out, 'kept')
  })

  test('falls back to the serialized result when there is no content', () => {
    const out = formatMcpToolResult({})
    assert.equal(out, '{}')
  })

  test('surfaces an MCP error so the model sees the failure', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'boom' }], isError: true })
    assert.match(out, /^Tool execution failed: /)
    assert.match(out, /boom/)
  })

  test('marks an error even when it carried no text body', () => {
    const out = formatMcpToolResult({ isError: true })
    assert.match(out, /Tool execution failed: /)
  })
})
