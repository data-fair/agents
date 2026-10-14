/**
 * stateless unit tests for what the agent-session upgrade refuses, and for how long an accepted socket
 * may speak for the person.
 *
 * The socket is authenticated from the cookie alone, so without an Origin check any page under the same
 * registrable domain (a sibling portal, an XSS anywhere on it) could open one as the visitor and read
 * every frame: cross-site websocket hijacking. A browser always sends Origin on a websocket handshake;
 * a client that sends none is not a browser, so it carries no ambient cookie to borrow.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { upgradeRefusal, sessionExpiresAt } from '../../../api/src/agent-session/upgrade.ts'

const proxied = (origin?: string) => ({
  'x-forwarded-host': 'portal.example.com',
  'x-forwarded-proto': 'https',
  ...(origin !== undefined ? { origin } : {})
})
const person = { user: { id: 'u1', name: 'U' } } as any

test.describe('the agent-session upgrade guard', () => {
  test('a page of the site the socket is opened on may open it', () => {
    assert.equal(upgradeRefusal(proxied('https://portal.example.com'), person), undefined)
  })

  test('a page of another site may not, a sibling of the same domain included', () => {
    assert.equal(upgradeRefusal(proxied('https://evil.example.com'), person)?.status, 403)
    assert.equal(upgradeRefusal(proxied('http://portal.example.com'), person)?.status, 403, 'the scheme is part of the origin')
    assert.equal(upgradeRefusal(proxied('null'), person)?.status, 403, 'an opaque origin (sandboxed frame) names no site')
  })

  test('a browser origin with no site to compare it to is refused, not waved through', () => {
    assert.equal(upgradeRefusal({ origin: 'https://portal.example.com' }, person)?.status, 403)
  })

  test('a client sending no Origin is not a browser, and is let in', () => {
    assert.equal(upgradeRefusal(proxied(), person), undefined)
    assert.equal(upgradeRefusal(proxied(), {} as any), undefined, 'anonymous too')
  })

  test('a pseudo session, which is read-only everywhere in the stack, may not open a socket that acts', () => {
    const pseudo = { user: { id: 'u1', name: 'U', pseudoSession: true } } as any
    assert.equal(upgradeRefusal(proxied('https://portal.example.com'), pseudo)?.status, 403)
  })

  test('a socket speaks for the person until their session token expires', () => {
    assert.equal(sessionExpiresAt({ user: { id: 'u1', exp: 1_700_000_000 } } as any), 1_700_000_000_000)
    assert.equal(sessionExpiresAt({} as any), undefined, 'an anonymous socket carries no token')
    assert.equal(sessionExpiresAt({ user: { id: 'u1' } } as any), undefined)
  })
})
