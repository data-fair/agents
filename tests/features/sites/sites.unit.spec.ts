/**
 * stateless unit tests for site origins: what makes "the site a call acts on" comparable
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { siteOrigin, siteOriginFromHeaders, forwardedSiteHeaders, accountSites } from '../../../api/src/sites/operations.ts'

test.describe('siteOrigin', () => {
  test('drops the path, the default port and the case', () => {
    assert.equal(siteOrigin('https://Portal.Example.org:443/data-fair/x?y'), 'https://portal.example.org')
    assert.equal(siteOrigin('http://localhost:5600/agents'), 'http://localhost:5600')
  })
})

test.describe('siteOriginFromHeaders', () => {
  test('reads host and proto', () => {
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'portal.example.org', 'x-forwarded-proto': 'https' }), 'https://portal.example.org')
  })
  test('keeps a non default port, from the host or from x-forwarded-port', () => {
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'localhost:5600', 'x-forwarded-proto': 'http' }), 'http://localhost:5600')
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'localhost', 'x-forwarded-proto': 'http', 'x-forwarded-port': '5600' }), 'http://localhost:5600')
  })
  test('normalizes so it compares equal to a stored site', () => {
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'Portal.Example.org:443', 'x-forwarded-proto': 'https' }), siteOrigin('https://portal.example.org/'))
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'a.example.org, proxy.internal', 'x-forwarded-proto': 'https, http' }), 'https://a.example.org')
  })
  test('is undefined without both headers, or with an unknown protocol', () => {
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'a.example.org' }), undefined)
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-proto': 'https' }), undefined)
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'a.example.org', 'x-forwarded-proto': 'ftp' }), undefined)
    assert.equal(siteOriginFromHeaders({ 'x-forwarded-host': 'bad host', 'x-forwarded-proto': 'https' }), undefined)
  })
})

test.describe('forwardedSiteHeaders', () => {
  test('names the host with its port, and the protocol', () => {
    assert.deepEqual(forwardedSiteHeaders('http://localhost:5600'), { 'x-forwarded-host': 'localhost:5600', 'x-forwarded-proto': 'http' })
    assert.deepEqual(forwardedSiteHeaders('https://portal.example.org/whatever'), { 'x-forwarded-host': 'portal.example.org', 'x-forwarded-proto': 'https' })
  })
})

test.describe('accountSites', () => {
  test('the enrolment site first, then the listed hosts, on its protocol, once each', () => {
    assert.deepEqual(
      accountSites('https://admin.example.org/', [{ host: 'portal.example.org' }, { host: 'ADMIN.example.org' }, { host: 'other.example.org:8443' }]).reachable,
      ['https://admin.example.org', 'https://portal.example.org', 'https://other.example.org:8443']
    )
  })

  test('skips a malformed listed host instead of throwing', () => {
    assert.deepEqual(
      accountSites('https://admin.example.org/', [{ host: 'bad host' }, { host: 'portal.example.org' }, { host: '' }]),
      { reachable: ['https://admin.example.org', 'https://portal.example.org'], unreachable: [] }
    )
  })

  test('onlyBackOffice portals share the platform realm of a platform enrolment', () => {
    assert.deepEqual(accountSites('http://main.test', [{ host: 'p.test' }, { host: 'q.test', authMode: 'onlyBackOffice' }]),
      { reachable: ['http://main.test', 'http://p.test', 'http://q.test'], unreachable: [] })
  })

  test('a portal that is its own realm is unreachable from the platform issuer', () => {
    assert.deepEqual(accountSites('http://main.test', [{ host: 'sso.test', authMode: 'ssoBackOffice' }]),
      { reachable: ['http://main.test'], unreachable: ['http://sso.test'] })
  })

  test('enrolled on the account main site, its onlyOtherSite portals are reachable and the platform-realm ones are not', () => {
    const listed = [{ host: 'acc.test', authMode: 'onlyLocal' }, { host: 'p.test', authMode: 'onlyOtherSite', authOnlyOtherSite: 'acc.test' }, { host: 'q.test' }]
    assert.deepEqual(accountSites('http://acc.test', listed), { reachable: ['http://acc.test', 'http://p.test'], unreachable: ['http://q.test'] })
  })

  test('an onlyOtherSite portal backed by a platform-realm site is in the platform realm', () => {
    const listed = [{ host: 'p.test', authMode: 'onlyOtherSite', authOnlyOtherSite: 'q.test' }, { host: 'q.test', authMode: 'onlyBackOffice' }]
    assert.deepEqual(accountSites('http://main.test', listed).reachable, ['http://main.test', 'http://p.test', 'http://q.test'])
  })

  test('a broken realm chain leaves the site unreachable, never throws', () => {
    const listed = [{ host: 'a.test', authMode: 'onlyOtherSite', authOnlyOtherSite: 'b.test' }, { host: 'b.test', authMode: 'onlyOtherSite', authOnlyOtherSite: 'a.test' }, { host: 'c.test', authMode: 'onlyOtherSite', authOnlyOtherSite: 'unlisted.test' }]
    assert.deepEqual(accountSites('http://main.test', listed).unreachable, ['http://a.test', 'http://b.test', 'http://c.test'])
  })
})
