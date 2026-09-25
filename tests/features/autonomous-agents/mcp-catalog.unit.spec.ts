/**
 * stateless unit tests for the global MCP server catalog config
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertGlobalMcpConfig, listMcpServerCatalog, unknownMcpServerIds, credentialHeaders, type GlobalMcpServer } from '../../../api/src/mcp-servers/operations.ts'

const servers: GlobalMcpServer[] = [
  { id: 'registry', name: 'Data Fair registry', url: 'https://example.org/mcp-registry/mcp', auth: 'nhi-session' },
  { id: 'public-docs', name: 'Public docs', url: 'https://example.org/docs-mcp/mcp', auth: 'none' },
  { id: 'third-party', name: 'Third party', url: 'https://third.example/mcp', auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'secret-value' }
]

test.describe('assertGlobalMcpConfig', () => {
  test('accepts a consistent config', () => {
    assertGlobalMcpConfig(servers)
  })

  test('accepts an empty catalog', () => {
    assertGlobalMcpConfig([])
  })

  test('rejects duplicate server ids', () => {
    assert.throws(() => assertGlobalMcpConfig([servers[0], { ...servers[1], id: 'registry' }]), /duplicate server id/)
  })

  test('rejects an unparseable url', () => {
    assert.throws(() => assertGlobalMcpConfig([{ ...servers[0], url: 'not a url' }]), /invalid url/)
  })

  test('rejects a non-http protocol', () => {
    assert.throws(() => assertGlobalMcpConfig([{ ...servers[0], url: 'ftp://example.org/mcp' }]), /must be http/)
  })

  test('rejects auth "apiKey" without apiKeyHeader', () => {
    const { apiKeyHeader, ...noHeader } = servers[2]
    assert.throws(() => assertGlobalMcpConfig([noHeader as GlobalMcpServer]), /requires apiKeyHeader/)
  })

  test('rejects auth "apiKey" without apiKey', () => {
    const { apiKey, ...noKey } = servers[2]
    assert.throws(() => assertGlobalMcpConfig([noKey as GlobalMcpServer]), /requires apiKey/)
  })

  test('rejects a credential on a server that does not use one', () => {
    assert.throws(() => assertGlobalMcpConfig([{ ...servers[1], apiKey: 'stray' }]), /must not carry apiKey/)
  })
})

test.describe('listMcpServerCatalog', () => {
  test('never exposes the credential', () => {
    const entries = listMcpServerCatalog(servers)
    const thirdParty = entries.find(e => e.id === 'third-party')
    assert.ok(thirdParty)
    assert.equal(JSON.stringify(entries).includes('secret-value'), false)
    assert.equal('apiKey' in thirdParty, false)
    assert.equal('apiKeyHeader' in thirdParty, false)
  })

  test('keeps the fields an admin picks by', () => {
    const entries = listMcpServerCatalog(servers)
    assert.deepEqual(entries[0], { id: 'registry', name: 'Data Fair registry', url: 'https://example.org/mcp-registry/mcp', auth: 'nhi-session' })
  })

  test('omits an absent description rather than emitting undefined', () => {
    const [entry] = listMcpServerCatalog([servers[0]])
    assert.equal('description' in entry, false)
  })
})

test.describe('unknownMcpServerIds', () => {
  test('returns the ids with no catalog entry', () => {
    assert.deepEqual(unknownMcpServerIds(servers, [{ serverId: 'registry' }, { serverId: 'nope' }]), ['nope'])
  })

  test('returns an empty array when every ref resolves', () => {
    assert.deepEqual(unknownMcpServerIds(servers, [{ serverId: 'registry' }, { serverId: 'public-docs' }]), [])
  })
})

// Full per-branch coverage of credentialHeaders lives in mcp-client.unit.spec.ts; these
// cases just confirm it composes correctly against real catalog entries (the ids/headers
// defined above), rather than re-deriving fixtures of its own.
test.describe('credentialHeaders against the catalog', () => {
  test('an "nhi-session" catalog entry replays the supplied cookie', () => {
    const registry = servers.find(s => s.id === 'registry') as GlobalMcpServer
    assert.deepEqual(credentialHeaders(registry, 'id_token=abc; id_token_sign=def'), { cookie: 'id_token=abc; id_token_sign=def' })
  })

  test('a "none" catalog entry never sends the cookie', () => {
    const publicDocs = servers.find(s => s.id === 'public-docs') as GlobalMcpServer
    assert.deepEqual(credentialHeaders(publicDocs, 'id_token=abc; id_token_sign=def'), {})
  })

  test('an "apiKey" catalog entry sends its configured header, never the cookie', () => {
    const thirdParty = servers.find(s => s.id === 'third-party') as GlobalMcpServer
    assert.deepEqual(credentialHeaders(thirdParty, 'id_token=abc; id_token_sign=def'), { 'x-api-key': 'secret-value' })
  })
})
