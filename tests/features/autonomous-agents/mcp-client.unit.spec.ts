/**
 * stateless unit tests for MCP credential selection.
 *
 * Tool-result formatting used to be tested here too, against an api-side COPY of the ui module —
 * the copy is gone (it is `shared/tool-result.ts` now) and so are these tests' duplicates of
 * `tests/features/tool-result/1.tool-result.unit.spec.ts`, which owns that module.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { callHeaders, personSiteCredentials, listingKey, scopedListingIdentity, connectionKey, type GlobalMcpServer } from '../../../api/src/mcp-servers/operations.ts'

const cookie = 'id_token=abc; id_token_sign=def'
const credential = { cookie }
const portal = 'https://portal.example.org'

const server = (over: Partial<GlobalMcpServer> = {}): GlobalMcpServer =>
  ({ id: 's', name: 'S', url: 'https://x/mcp', auth: 'none', ...over })

test.describe('callHeaders', () => {
  test('a site-bound entry is told its site, and gets the cookie of that site', () => {
    assert.deepEqual(callHeaders(server({ auth: 'nhi-session' }), portal, credential), { 'x-forwarded-host': 'portal.example.org', 'x-forwarded-proto': 'https', cookie })
  })
  test('outside the account: the site, and no cookie', () => {
    assert.deepEqual(callHeaders(server({ auth: 'nhi-session' }), portal, undefined), { 'x-forwarded-host': 'portal.example.org', 'x-forwarded-proto': 'https' })
  })
  test('never a cookie without a site', () => {
    assert.deepEqual(callHeaders(server({ auth: 'nhi-session' }), undefined, credential), {})
  })
  test('a public entry gets nothing, whatever the site', () => {
    assert.deepEqual(callHeaders(server({ auth: 'none' }), portal, credential), {})
  })
  test('an apiKey entry gets its header only', () => {
    assert.deepEqual(callHeaders(server({ auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'secret' }), portal, credential), { 'x-api-key': 'secret' })
  })
  test('a site-bound call forwards the person\'s IP when there is one', () => {
    assert.equal(callHeaders(server({ auth: 'nhi-session' }), portal, credential, '203.0.113.7')['x-forwarded-for'], '203.0.113.7')
  })
  test('and none on a task run, which acts for no address', () => {
    assert.equal(callHeaders(server({ auth: 'nhi-session' }), portal, credential, undefined)['x-forwarded-for'], undefined)
  })
  test('a bearer travels as authorization, never as a cookie', () => {
    const headers = callHeaders(server({ auth: 'nhi-session' }), portal, { bearer: 'tok' })
    assert.equal(headers.authorization, 'Bearer tok')
    assert.equal('cookie' in headers, false)
  })
  test('a third-party server never receives it', () => {
    assert.equal(callHeaders(server({ auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'secret' }), portal, undefined, '203.0.113.7')['x-forwarded-for'], undefined)
    assert.equal(callHeaders(server({ auth: 'none' }), portal, undefined, '203.0.113.7')['x-forwarded-for'], undefined)
  })
})

test.describe('personSiteCredentials', () => {
  test('the person\'s cookie goes to the site of their socket only', async () => {
    const sites = personSiteCredentials(portal, cookie)
    assert.equal(sites.homeSite, portal)
    assert.deepEqual(await sites.credentialFor(portal), credential)
    assert.equal(await sites.credentialFor('https://admin.example.org'), undefined)
  })
  test('their listings are cached per person, under a hash of the session, never the session itself', () => {
    const sites = personSiteCredentials(portal, cookie)
    assert.equal(sites.listingIdentity.includes(cookie), false)
    assert.notEqual(sites.listingIdentity, personSiteCredentials(portal, 'id_token=other').listingIdentity)
    assert.equal(personSiteCredentials(portal, undefined).listingIdentity, 'anonymous')
  })
})

test.describe('listingKey and connectionKey', () => {
  test('a site-bound entry is listed and connected per site', () => {
    const s = server({ auth: 'nhi-session' })
    assert.notEqual(listingKey(s, portal, 'agent:a1'), listingKey(s, 'https://admin.example.org', 'agent:a1'))
    assert.notEqual(listingKey(s, portal, 'agent:a1'), listingKey(s, portal, 'agent:a2'))
    assert.notEqual(connectionKey(s, portal), connectionKey(s, 'https://admin.example.org'))
  })
  test('other entries are one listing and one connection', () => {
    const s = server({ auth: 'none' })
    assert.equal(listingKey(s, portal, 'agent:a1'), listingKey(s, undefined, 'anonymous'))
    assert.equal(connectionKey(s, portal), connectionKey(s, undefined))
  })
})

test.describe('scopedListingIdentity', () => {
  test('a new scope claim lists afresh: two scope sets never share a listing', () => {
    const a = scopedListingIdentity('agent:x', ['datasets:read'])
    assert.notEqual(a, scopedListingIdentity('agent:x', ['datasets:read', 'applications:read']))
    assert.notEqual(a, scopedListingIdentity('agent:x', undefined))
  })
  test('the order of the claim does not matter', () => {
    assert.equal(scopedListingIdentity('agent:x', ['b', 'a']), scopedListingIdentity('agent:x', ['a', 'b']))
  })
})
