/**
 * stateless unit tests for MCP credential selection and tool-result formatting
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { credentialHeaders, type GlobalMcpServer } from '../../../api/src/mcp-servers/operations.ts'
import { formatMcpToolResult } from '../../../api/src/mcp-servers/tool-result.ts'

const cookie = 'id_token=abc; id_token_sign=def'

const server = (over: Partial<GlobalMcpServer> = {}): GlobalMcpServer =>
  ({ id: 's', name: 'S', url: 'https://x/mcp', auth: 'none', ...over })

test.describe('credentialHeaders', () => {
  test('auth "nhi-session" replays the session as a Cookie header', () => {
    assert.deepEqual(credentialHeaders(server({ auth: 'nhi-session' }), cookie), { cookie })
  })

  test('auth "none" sends no credential even when a session exists', () => {
    assert.deepEqual(credentialHeaders(server({ auth: 'none' }), cookie), {})
  })

  test('auth "apiKey" sends the configured header and never the cookie', () => {
    const headers = credentialHeaders(server({ auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'secret' }), cookie)
    assert.deepEqual(headers, { 'x-api-key': 'secret' })
    assert.equal(JSON.stringify(headers).includes('id_token'), false)
  })

  test('auth "nhi-session" with no session throws rather than calling unauthenticated', () => {
    // silently dropping the credential would make the call run as anonymous and the
    // failure would surface as a confusing permission error from the far end
    assert.throws(() => credentialHeaders(server({ auth: 'nhi-session' }), undefined), /requires a session/)
  })
})

test.describe('formatMcpToolResult', () => {
  test('joins text parts', () => {
    assert.equal(formatMcpToolResult({ content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }), 'a\nb')
  })

  test('prefixes an error result', () => {
    assert.equal(formatMcpToolResult({ content: [{ type: 'text', text: 'boom' }], isError: true }), 'Tool execution failed: boom')
  })

  test('wraps image parts in the media envelope the gateway decodes', () => {
    const out = formatMcpToolResult({ content: [{ type: 'text', text: 'see' }, { type: 'image', data: 'AAAA', mimeType: 'image/png' }] })
    assert.deepEqual(out, { _agentsMediaResult: true, text: 'see', media: [{ data: 'AAAA', mediaType: 'image/png' }] })
  })

  // The `[]` vs `undefined` asymmetry is real and surprising, so both branches are pinned.
  // `textParts?.join('\n')` yields '' for a present-but-empty content array, and `??` only
  // catches null/undefined, so the JSON.stringify fallback fires ONLY when `content` is
  // absent entirely. Verified against ui/src/utils/tool-result.ts, which this file ports
  // verbatim. Do NOT "fix" this here: Plan C de-duplicates the two copies into shared/, and
  // that is where the behaviour should be reconsidered.
  test('returns an empty string for a present-but-empty content array', () => {
    assert.equal(formatMcpToolResult({ content: [] }), '')
  })

  test('falls back to the serialized result only when content is absent entirely', () => {
    assert.equal(formatMcpToolResult({}), '{}')
  })

  // Characterisation test for a known wart, deliberately pinned so that whoever fixes it in
  // shared/ has to update this test consciously rather than discovering the behaviour by
  // accident: an errored tool with no text yields a prefix and nothing else, which tells a
  // model nothing about what failed.
  test('an errored result with no text yields a bare prefix — known wart, pinned', () => {
    assert.equal(formatMcpToolResult({ content: [], isError: true }), 'Tool execution failed: ')
  })
})
