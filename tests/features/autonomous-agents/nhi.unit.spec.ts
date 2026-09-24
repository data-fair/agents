/**
 * stateless unit tests for the NHI issuer's pure helpers
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertNhiConfig, toPublicJwk, nhiIssuerUrl, nhiExchangeUrl, exchangeHeaders, autonomousAgentSubject, type NhiPrivateJwk } from '../../../api/src/nhi/operations.ts'

const key: NhiPrivateJwk = {
  kty: 'EC',
  crv: 'P-256',
  x: 'iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig',
  y: 'nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M',
  d: 'Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q',
  kid: 'dev-1',
  alg: 'ES256'
}

test.describe('assertNhiConfig', () => {
  test('accepts the feature being entirely off', () => {
    assertNhiConfig(undefined)
  })

  test('accepts a valid key', () => {
    assertNhiConfig(key)
  })

  test('rejects a non-EC key', () => {
    assert.throws(() => assertNhiConfig({ ...key, kty: 'RSA' }), /must be an EC/)
  })

  test('rejects a curve other than P-256', () => {
    assert.throws(() => assertNhiConfig({ ...key, crv: 'P-384' }), /P-256/)
  })

  test('rejects a public key — signing needs the private half', () => {
    const { d, ...pub } = key
    assert.throws(() => assertNhiConfig(pub), /private/)
  })

  test('rejects a key with no kid — rotation depends on it', () => {
    const { kid, ...noKid } = key
    assert.throws(() => assertNhiConfig(noKid), /kid/)
  })

  test('rejects a non-object signing key', () => {
    assert.throws(() => assertNhiConfig('not-a-jwk'), /must be a JSON object/)
  })
})

test.describe('toPublicJwk', () => {
  test('strips the private scalar and marks the key for signature use', () => {
    const pub = toPublicJwk(key)
    assert.equal('d' in pub, false)
    assert.equal(JSON.stringify(pub).includes(key.d), false)
    assert.equal(pub.use, 'sig')
    assert.equal(pub.alg, 'ES256')
    assert.equal(pub.kid, 'dev-1')
    assert.equal(pub.x, key.x)
    assert.equal(pub.y, key.y)
  })

  test('defaults alg to ES256 when the private key omits it', () => {
    const { alg, ...noAlg } = key
    assert.equal(toPublicJwk(noAlg as NhiPrivateJwk).alg, 'ES256')
  })
})

test.describe('nhiIssuerUrl', () => {
  test('mounts the issuer under the service path of the captured site url', () => {
    assert.equal(nhiIssuerUrl('http://localhost:25475'), 'http://localhost:25475/agents/api/nhi')
  })

  test('preserves a path-based site prefix', () => {
    assert.equal(nhiIssuerUrl('https://example.org/portal'), 'https://example.org/portal/agents/api/nhi')
  })

  test('tolerates a trailing slash without doubling it', () => {
    assert.equal(nhiIssuerUrl('https://example.org/portal/'), 'https://example.org/portal/agents/api/nhi')
  })
})

test.describe('nhiExchangeUrl', () => {
  // Both segments are mandatory: simple-directory calls createSiteMiddleware('simple-directory')
  // with no options, so a url without a /simple-directory segment throws 404 before the
  // route runs, and a missing sitePath prefix resolves a different site.
  test('inserts the /simple-directory segment on the main site', () => {
    assert.equal(
      nhiExchangeUrl('http://simple-directory:8080', 'http://localhost:25475'),
      'http://simple-directory:8080/simple-directory/api/auth/nhi-token'
    )
  })

  test('preserves the site path prefix ahead of the service segment', () => {
    assert.equal(
      nhiExchangeUrl('http://simple-directory:8080', 'https://example.org/portal'),
      'http://simple-directory:8080/portal/simple-directory/api/auth/nhi-token'
    )
  })

  test('does not leave a double slash for a root site url', () => {
    assert.equal(nhiExchangeUrl('http://simple-directory:8080/', 'https://example.org/'), 'http://simple-directory:8080/simple-directory/api/auth/nhi-token')
  })
})

test.describe('exchangeHeaders', () => {
  test('declares the three headers the route requires', () => {
    const h = exchangeHeaders('http://localhost:25475')
    assert.equal(h['x-forwarded-host'], 'localhost:25475')
    assert.equal(h['x-forwarded-proto'], 'http')
    assert.equal(h['x-forwarded-for'], '127.0.0.1')
    assert.equal(h['content-type'], 'application/json')
  })

  test('drops a default https port from the declared host', () => {
    const h = exchangeHeaders('https://example.org')
    assert.equal(h['x-forwarded-host'], 'example.org')
    assert.equal(h['x-forwarded-proto'], 'https')
  })

  // THE invariant of this whole exchange: simple-directory rebuilds the audience as
  // reqOrigin(from our declared headers) + reqSitePath(from the url path we posted to),
  // and compares it to the `aud` we signed — which is the stored site url. If these ever
  // disagree, every exchange fails as an indistinguishable 401 with no diagnostic.
  for (const siteUrl of ['http://localhost:25475', 'https://example.org', 'https://example.org/portal', 'http://example.org:8080/portal']) {
    test(`declared headers + posted path reconstruct exactly the signed audience — ${siteUrl}`, () => {
      const h = exchangeHeaders(siteUrl)
      const [host, port] = h['x-forwarded-host'].split(':')
      const proto = h['x-forwarded-proto']
      const origin = port && !(port === '443' && proto === 'https') && !(port === '80' && proto === 'http')
        ? `${proto}://${host}:${port}`
        : `${proto}://${host}`
      // simple-directory's sitePath is match[1] of (.*?)\/simple-directory(\/|$) against
      // the path we posted to — i.e. exactly the prefix nhiExchangeUrl preserved
      const posted = new URL(nhiExchangeUrl('http://sd:8080', siteUrl)).pathname
      const sitePath = posted.slice(0, posted.indexOf('/simple-directory'))
      assert.equal(origin + sitePath, siteUrl.replace(/\/$/, ''))
    })
  }
})

test.describe('autonomousAgentSubject', () => {
  test('the subject namespaces the autonomous agent id', () => {
    assert.equal(autonomousAgentSubject('abc123'), 'autonomous-agent:abc123')
  })
})
