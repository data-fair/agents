/**
 * stateless unit tests for the NHI issuer's pure helpers
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertNhiConfig, toPublicJwk, nhiIssuerUrl, nhiAudience, autonomousAgentSubject, type NhiPrivateJwk } from '../../../api/src/nhi/operations.ts'

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
    assertNhiConfig(undefined, undefined)
  })

  test('accepts a valid key with a publicUrl', () => {
    assertNhiConfig(key, 'http://localhost:25475/agents')
  })

  test('rejects a signing key without a publicUrl — the issuer url would not be derivable', () => {
    assert.throws(() => assertNhiConfig(key, undefined), /requires PUBLIC_URL/)
  })

  test('rejects a non-EC key', () => {
    assert.throws(() => assertNhiConfig({ ...key, kty: 'RSA' }, 'http://x/agents'), /must be an EC/)
  })

  test('rejects a curve other than P-256', () => {
    assert.throws(() => assertNhiConfig({ ...key, crv: 'P-384' }, 'http://x/agents'), /P-256/)
  })

  test('rejects a public key — signing needs the private half', () => {
    const { d, ...pub } = key
    assert.throws(() => assertNhiConfig(pub, 'http://x/agents'), /private/)
  })

  test('rejects a key with no kid — rotation depends on it', () => {
    const { kid, ...noKid } = key
    assert.throws(() => assertNhiConfig(noKid, 'http://x/agents'), /kid/)
  })

  test('rejects a non-object signing key', () => {
    assert.throws(() => assertNhiConfig('not-a-jwk', 'http://x/agents'), /must be a JSON object/)
  })

  test('rejects an unparseable publicUrl', () => {
    assert.throws(() => assertNhiConfig(key, 'not a url'), /invalid PUBLIC_URL/)
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

test.describe('url and subject helpers', () => {
  test('the issuer is the publicUrl plus /api/nhi, with no double slash', () => {
    assert.equal(nhiIssuerUrl('http://localhost:25475/agents'), 'http://localhost:25475/agents/api/nhi')
    assert.equal(nhiIssuerUrl('http://localhost:25475/agents/'), 'http://localhost:25475/agents/api/nhi')
  })

  test('the audience is the site ORIGIN, not the service path', () => {
    assert.equal(nhiAudience('http://localhost:25475/agents'), 'http://localhost:25475')
    assert.equal(nhiAudience('https://example.org/agents'), 'https://example.org')
  })

  test('the subject namespaces the autonomous agent id', () => {
    assert.equal(autonomousAgentSubject('abc123'), 'autonomous-agent:abc123')
  })
})
