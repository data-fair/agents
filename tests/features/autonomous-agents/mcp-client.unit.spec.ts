/**
 * stateless unit tests for MCP credential selection.
 *
 * Tool-result formatting used to be tested here too, against an api-side COPY of the ui module —
 * the copy is gone (it is `shared/tool-result.ts` now) and so are these tests' duplicates of
 * `tests/features/tool-result/1.tool-result.unit.spec.ts`, which owns that module.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { credentialHeaders, type GlobalMcpServer } from '../../../api/src/mcp-servers/operations.ts'

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
