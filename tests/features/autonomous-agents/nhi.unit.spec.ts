/**
 * stateless unit tests for the NHI issuer's pure helpers
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertNhiConfig, toPublicJwk, nhiIssuerUrl, nhiExchangeUrl, exchangeHeaders, autonomousAgentSubject, buildAssertionClaims, shouldRefreshSession, decodeSessionClaims, sanitizeExchangeError, type NhiPrivateJwk } from '../../../api/src/nhi/operations.ts'

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

test.describe('buildAssertionClaims', () => {
  const base = { issuer: 'http://x/agents/api/nhi', subject: 'autonomous-agent:a1', audience: 'http://x', ttlSeconds: 300, nowSeconds: 1_700_000_000 }

  test('sets every claim simple-directory requires', () => {
    const claims = buildAssertionClaims(base)
    assert.equal(claims.iss, base.issuer)
    assert.equal(claims.sub, base.subject)
    assert.equal(claims.aud, base.audience)
    // verifyAssertion passes requiredClaims: ['exp', 'sub', 'iat']
    assert.equal(claims.iat, base.nowSeconds)
    assert.equal(claims.exp, base.nowSeconds + 300)
  })

  test('the session length is capped by this ttl, so it must be honoured exactly', () => {
    assert.equal(buildAssertionClaims({ ...base, ttlSeconds: 120 }).exp - base.nowSeconds, 120)
  })

  test('each assertion carries a distinct jti', () => {
    assert.notEqual(buildAssertionClaims(base).jti, buildAssertionClaims(base).jti)
  })
})

test.describe('shouldRefreshSession', () => {
  const ttl = 300_000

  test('does not refresh a fresh session', () => {
    assert.equal(shouldRefreshSession(1_000_000 + ttl, 1_000_000, ttl), false)
  })

  test('refreshes once past 80% of the lifetime', () => {
    // 80% of 300s = 240s in; expiry is at now + 60s
    assert.equal(shouldRefreshSession(1_000_000 + 60_000, 1_000_000, ttl), true)
  })

  test('refreshes an already expired session', () => {
    assert.equal(shouldRefreshSession(1_000_000 - 1, 1_000_000, ttl), true)
  })
})

test.describe('decodeSessionClaims', () => {
  const claims = { id: 'nhi-abc', name: 'agent', organization: { id: 'test1' }, nhi: 1, exp: 1_700_000_300 }
  const idToken = 'eyJhbGciOiJSUzI1NiJ9.' + Buffer.from(JSON.stringify(claims)).toString('base64url')

  test('reads the claims out of the id_token cookie', () => {
    assert.deepEqual(decodeSessionClaims(`id_token=${idToken}; id_token_sign=zzz`), claims)
  })

  test('finds id_token regardless of position', () => {
    assert.equal(decodeSessionClaims(`id_token_sign=zzz; id_token=${idToken}`).id, 'nhi-abc')
  })

  test('throws when there is no id_token cookie', () => {
    assert.throws(() => decodeSessionClaims('id_token_sign=zzz'), /no id_token cookie/)
  })

  test('throws on a cookie that is not a header.payload pair', () => {
    assert.throws(() => decodeSessionClaims('id_token=nodots'), /header.payload pair/)
  })

  // describeAutonomousAgentSession's whole purpose is a diagnostic that never leaks the
  // cookie. It is not pure (it calls getAutonomousAgentSession, which needs #config), so
  // it cannot be unit-tested directly — but its decode step and its projection are pure,
  // and are pinned here.
  test('a realistic two-cookie session string yields only claims, never the raw token', () => {
    const claims = { id: 'nhi-abc', name: 'agent', organization: { id: 'test1' }, nhi: 1, exp: 1_700_000_300 }
    const idToken = 'eyJhbGciOiJSUzI1NiJ9.' + Buffer.from(JSON.stringify(claims)).toString('base64url')
    // a realistic Set-Cookie-derived header: id_token carries header.payload, id_token_sign
    // the signature — exactly the two cookies simple-directory splits the session JWT across.
    const cookieHeader = `id_token=${idToken}; id_token_sign=zzz-signature-blob`
    const decoded = decodeSessionClaims(cookieHeader)
    assert.deepEqual(decoded, claims)
    const serialized = JSON.stringify(decoded)
    assert.equal(serialized.includes(idToken), false)
    assert.equal(serialized.includes('zzz-signature-blob'), false)
  })

  test('the /session projection carries only its five fields, nothing resembling id_token', () => {
    // Mirrors describeAutonomousAgentSession's projection (api/src/autonomous-agents/service.ts)
    // exactly, built on the pure decode step only, so the no-secret-leak property stays
    // testable at unit level without an NHI or #config.
    const claims = { id: 'nhi-abc', name: 'agent', organization: { id: 'test1' }, nhi: 1, exp: Math.floor(Date.now() / 1000) + 120 }
    const idToken = 'eyJhbGciOiJSUzI1NiJ9.' + Buffer.from(JSON.stringify(claims)).toString('base64url')
    const cookieHeader = `id_token=${idToken}; id_token_sign=zzz-signature-blob`
    const decoded = decodeSessionClaims(cookieHeader)
    const projection = {
      userId: decoded.id,
      userName: decoded.name,
      organization: decoded.organization?.id,
      nhi: decoded.nhi === 1 || decoded.nhi === true,
      expiresIn: typeof decoded.exp === 'number' ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : undefined
    }
    assert.deepEqual(Object.keys(projection).sort(), ['expiresIn', 'nhi', 'organization', 'userId', 'userName'])
    const serialized = JSON.stringify(projection)
    assert.equal(serialized.includes(idToken), false)
    assert.equal(/id_token/i.test(serialized), false)
  })
})

test.describe('sanitizeExchangeError', () => {
  const fake = () => {
    const err: any = new Error('401 - invalid credentials')
    // the shape lib-node's interceptor actually produces
    err.config = { method: 'post', url: 'http://sd:8080/simple-directory/api/auth/nhi-token', data: JSON.stringify({ client_id: 'nhi-abc', assertion: 'eyJhbGciOiJFUzI1NiJ9.SECRET_ASSERTION.sig' }) }
    err.response = { status: 401, config: err.config }
    return err
  }

  test('keeps the scrubbed message', () => {
    assert.match(sanitizeExchangeError(fake()).message, /401 - invalid credentials/)
  })

  test('drops the request body, so a live assertion cannot reach a log or a caller', () => {
    const sanitized = sanitizeExchangeError(fake())
    assert.equal('config' in sanitized, false)
    assert.equal('response' in sanitized, false)
    // belt and braces: the credential must not survive anywhere on the object
    assert.equal(JSON.stringify(sanitized, Object.getOwnPropertyNames(sanitized)).includes('SECRET_ASSERTION'), false)
  })

  test('tolerates a non-error rejection', () => {
    assert.match(sanitizeExchangeError('boom').message, /unknown error/)
  })

  test('does not link the original error, so the credential cannot be reached through a cause chain', () => {
    const sanitized: any = sanitizeExchangeError(fake())
    // A `new Error(msg, { cause: err })` implementation would pass every other assertion
    // here — the filter array in JSON.stringify(x, getOwnPropertyNames(x)) excludes nested
    // paths at every depth, so cause.config.data never appears. This assertion is what
    // actually forbids reintroducing the leak.
    assert.equal('cause' in sanitized, false)
    assert.equal(sanitized.cause, undefined)
  })
})
