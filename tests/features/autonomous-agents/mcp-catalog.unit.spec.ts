/**
 * stateless unit tests for the global MCP server catalog config
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertGlobalMcpConfig, assertPersonalAssistantsConfig, entriesForSite, listMcpServerCatalog, unknownMcpServerIds, callHeaders, type GlobalMcpServer } from '../../../api/src/mcp-servers/operations.ts'

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

// Full per-branch coverage of callHeaders lives in mcp-client.unit.spec.ts; these
// cases just confirm it composes correctly against real catalog entries (the ids/headers
// defined above), rather than re-deriving fixtures of its own.
test.describe('callHeaders against the catalog', () => {
  test('an "nhi-session" catalog entry replays the supplied cookie', () => {
    const registry = servers.find(s => s.id === 'registry') as GlobalMcpServer
    assert.deepEqual(callHeaders(registry, 'https://a.example.org', { cookie: 'id_token=abc; id_token_sign=def' }), { 'x-forwarded-host': 'a.example.org', 'x-forwarded-proto': 'https', cookie: 'id_token=abc; id_token_sign=def' })
  })

  test('a "none" catalog entry never sends the cookie', () => {
    const publicDocs = servers.find(s => s.id === 'public-docs') as GlobalMcpServer
    assert.deepEqual(callHeaders(publicDocs, 'https://a.example.org', { cookie: 'id_token=abc; id_token_sign=def' }), {})
  })

  test('an "apiKey" catalog entry sends its configured header, never the cookie', () => {
    const thirdParty = servers.find(s => s.id === 'third-party') as GlobalMcpServer
    assert.deepEqual(callHeaders(thirdParty, 'https://a.example.org', { cookie: 'id_token=abc; id_token_sign=def' }), { 'x-api-key': 'secret-value' })
  })
})

const configSchema = JSON.parse(readFileSync(new URL('../../../api/config/type/schema.json', import.meta.url), 'utf8'))

test.describe('no profile vocabulary', () => {
  test('a catalog entry with profilesUrl is no longer part of the config schema', () => {
    const entry = configSchema.properties.mcpServers.items
    assert.equal(entry.additionalProperties, false)
    assert.equal(entry.properties.profilesUrl, undefined)
  })
  test('a personal assistant reference with profiles is refused by the config schema', () => {
    for (const key of ['portal', 'backOffice']) {
      const ref = configSchema.properties.personalAssistants.properties[key].properties.mcpServers.items
      assert.equal(ref.additionalProperties, false)
      assert.equal(ref.properties.profiles, undefined)
    }
  })
  test('listMcpServerCatalog carries no profiled flag', () => {
    assert.equal('profiled' in listMcpServerCatalog([servers[0]])[0], false)
  })
})

test.describe('assertPersonalAssistantsConfig', () => {
  test('refuses a personal assistant naming a server the catalog does not have', () => {
    assert.throws(() => assertPersonalAssistantsConfig({ portal: { mcpServers: [{ serverId: 'nope' }] } }, servers), /personal assistant "portal" references unknown MCP server "nope"/)
    assertPersonalAssistantsConfig({ portal: { mcpServers: [{ serverId: 'registry' }] } }, servers)
  })
  // a personal assistant acts as the person, anonymous for a visitor: a 'home' entry is never called anonymously
  test('refuses a personal assistant naming a home-site entry', () => {
    const home: GlobalMcpServer = { id: 'p', name: 'P', url: 'http://h/mcp', auth: 'nhi-session', sites: 'home' }
    assert.throws(() => assertPersonalAssistantsConfig({ backOffice: { mcpServers: [{ serverId: 'p' }] } }, [...servers, home]), /personal assistant "backOffice" references MCP server "p", which serves the home site only/)
  })
})

test.describe('home-site entries', () => {
  const platform: GlobalMcpServer = { id: 'p', name: 'P', url: 'http://h/mcp', auth: 'nhi-session', sites: 'home', homeAlternative: 'd' }
  const datasets: GlobalMcpServer = { id: 'd', name: 'D', url: 'http://h/datasets/mcp', auth: 'nhi-session' }
  test('a paired home entry and its alternative are accepted', () => {
    assertGlobalMcpConfig([platform, datasets])
  })
  test('homeAlternative must name an nhi-session entry with sites all', () => {
    assert.throws(() => assertGlobalMcpConfig([{ ...platform, homeAlternative: 'nope' }, datasets]), /homeAlternative/)
    assert.throws(() => assertGlobalMcpConfig([platform, { ...datasets, sites: 'home' }]), /homeAlternative/)
    assert.throws(() => assertGlobalMcpConfig([platform, { ...datasets, auth: 'none' }]), /homeAlternative/)
  })
  test('sites is refused on an entry that is not site-bound', () => {
    assert.throws(() => assertGlobalMcpConfig([{ id: 'x', name: 'x', url: 'http://x/mcp', auth: 'none', sites: 'home' }]), /sites/)
  })
  test('in the account, the paired datasets entry is left out of the home site', () => {
    assert.deepEqual(entriesForSite([platform, datasets], [{ serverId: 'p' }, { serverId: 'd' }], 'account'),
      [{ ref: { serverId: 'p' }, onHome: true }, { ref: { serverId: 'd' }, onHome: false }])
  })
  test("a 'home' entry outside the account is silently absent", () => {
    assert.deepEqual(entriesForSite([platform, datasets], [{ serverId: 'p' }, { serverId: 'd' }], 'anonymous'),
      [{ ref: { serverId: 'd' }, onHome: true }])
    assert.deepEqual(entriesForSite([platform, datasets], [{ serverId: 'p' }], 'unconfirmed'), [])
  })
  test('an unpaired all entry stays on the home site', () => {
    assert.deepEqual(entriesForSite([platform, datasets], [{ serverId: 'd' }], 'account'), [{ ref: { serverId: 'd' }, onHome: true }])
  })
  test('an unknown reference is kept for the caller to refuse by name', () => {
    assert.deepEqual(entriesForSite([platform, datasets], [{ serverId: 'zz' }], 'account'), [{ ref: { serverId: 'zz' }, onHome: true }])
  })
})
