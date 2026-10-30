/**
 * stateless unit tests for the NHI issuer's pure helpers
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateNhiKey, signingNhiKey, nhiKeysNeedRotation, rotateNhiKeys, NHI_KEY_PUBLISH_AHEAD_SECONDS, NHI_KEY_ROTATION_DAYS, sessionNeedsRenewal, SESSION_RENEW_MARGIN_SECONDS, ASSERTION_TTL_SECONDS, toPublicJwk, nhiIssuerUrl, nhiTokenUrl, tokenRequestHeaders, tokenRequestBody, mcpResource, autonomousAgentSubject, buildAssertionClaims, credentialClaims, credentialScopes, accountPlacement, sanitizeExchangeError, tokenRequestError, type NhiPrivateJwk } from '../../../api/src/nhi/operations.ts'

const key: NhiPrivateJwk = {
  kty: 'EC',
  crv: 'P-256',
  x: 'iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig',
  y: 'nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M',
  d: 'Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q',
  kid: 'dev-1',
  alg: 'ES256'
}

test.describe('NHI signing keys', () => {
  const t0 = new Date('2026-01-01T00:00:00Z')
  const later = (seconds: number) => new Date(t0.getTime() + seconds * 1000)
  const DAY = 24 * 60 * 60

  test('a generated key is a private ES256 JWK with a kid of its own', () => {
    const { jwk, createdAt } = generateNhiKey(t0)
    assert.equal(createdAt, t0)
    assert.equal(jwk.kty, 'EC')
    assert.equal(jwk.crv, 'P-256')
    assert.equal(jwk.alg, 'ES256')
    assert.ok(jwk.d && jwk.x && jwk.y)
    assert.notEqual(generateNhiKey(t0).jwk.kid, jwk.kid)
  })

  test('the only key of a fresh deployment signs at once', () => {
    const first = generateNhiKey(t0)
    assert.equal(signingNhiKey([first], t0), first)
  })

  test('a key is due for rotation after NHI_KEY_ROTATION_DAYS', () => {
    const keys = [generateNhiKey(t0)]
    assert.equal(nhiKeysNeedRotation(keys, later(NHI_KEY_ROTATION_DAYS * DAY - 1)), false)
    assert.equal(nhiKeysNeedRotation(keys, later(NHI_KEY_ROTATION_DAYS * DAY)), true)
  })

  test('a new key is published before it signs, and the one it replaces stays published', () => {
    const old = generateNhiKey(t0)
    const rotatedAt = later(NHI_KEY_ROTATION_DAYS * DAY)
    const next = generateNhiKey(rotatedAt)
    const keys = rotateNhiKeys([old], next)
    assert.deepEqual(keys, [next, old])
    const after = (seconds: number) => new Date(rotatedAt.getTime() + seconds * 1000)
    assert.equal(signingNhiKey(keys, after(NHI_KEY_PUBLISH_AHEAD_SECONDS - 1)), old)
    assert.equal(signingNhiKey(keys, after(NHI_KEY_PUBLISH_AHEAD_SECONDS)), next)
    // nothing signs with a key older than the one replaced: it is dropped at the next rotation
    const third = generateNhiKey(later(2 * NHI_KEY_ROTATION_DAYS * DAY))
    assert.deepEqual(rotateNhiKeys(keys, third), [third, next])
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

test.describe('nhiTokenUrl', () => {
  // Both segments are mandatory: simple-directory calls createSiteMiddleware('simple-directory')
  // with no options, so a url without a /simple-directory segment throws 404 before the
  // route runs, and a missing sitePath prefix resolves a different site.
  test('inserts the /simple-directory segment on the main site', () => {
    assert.equal(
      nhiTokenUrl('http://simple-directory:8080', 'http://localhost:25475'),
      'http://simple-directory:8080/simple-directory/api/oauth/token'
    )
  })

  test('preserves the site path prefix ahead of the service segment', () => {
    assert.equal(
      nhiTokenUrl('http://simple-directory:8080', 'https://example.org/portal'),
      'http://simple-directory:8080/portal/simple-directory/api/oauth/token'
    )
  })

  test('does not leave a double slash for a root site url', () => {
    assert.equal(nhiTokenUrl('http://simple-directory:8080/', 'https://example.org/'), 'http://simple-directory:8080/simple-directory/api/oauth/token')
  })
})

test.describe('tokenRequestHeaders', () => {
  test('declares the three headers the route requires', () => {
    const h = tokenRequestHeaders('http://localhost:25475')
    assert.equal(h['x-forwarded-host'], 'localhost:25475')
    assert.equal(h['x-forwarded-proto'], 'http')
    assert.equal(h['x-forwarded-for'], '127.0.0.1')
    assert.equal(h['content-type'], 'application/x-www-form-urlencoded')
  })

  test('drops a default https port from the declared host', () => {
    const h = tokenRequestHeaders('https://example.org')
    assert.equal(h['x-forwarded-host'], 'example.org')
    assert.equal(h['x-forwarded-proto'], 'https')
  })

  // THE invariant of this whole exchange: simple-directory rebuilds the audience as
  // reqOrigin(from our declared headers) + reqSitePath(from the url path we posted to),
  // and compares it to the `aud` we signed — which is the stored site url. If these ever
  // disagree, every exchange fails as an indistinguishable 401 with no diagnostic.
  for (const siteUrl of ['http://localhost:25475', 'https://example.org', 'https://example.org/portal', 'http://example.org:8080/portal']) {
    test(`declared headers + posted path reconstruct exactly the signed audience — ${siteUrl}`, () => {
      const h = tokenRequestHeaders(siteUrl)
      const [host, port] = h['x-forwarded-host'].split(':')
      const proto = h['x-forwarded-proto']
      const origin = port && !(port === '443' && proto === 'https') && !(port === '80' && proto === 'http')
        ? `${proto}://${host}:${port}`
        : `${proto}://${host}`
      // simple-directory's sitePath is match[1] of (.*?)\/simple-directory(\/|$) against
      // the path we posted to — i.e. exactly the prefix nhiTokenUrl preserved
      const posted = new URL(nhiTokenUrl('http://sd:8080', siteUrl)).pathname
      const sitePath = posted.slice(0, posted.indexOf('/simple-directory'))
      assert.equal(origin + sitePath, siteUrl.replace(/\/$/, ''))
    })
  }
})

test.describe('tokenRequestBody', () => {
  test('the token request is the JWT bearer grant for an MCP resource, with no scope', () => {
    const body = new URLSearchParams(tokenRequestBody({ clientId: 'c1', assertion: 'a.b.c', resource: 'http://p.test/mcp-server' }))
    assert.equal(body.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer')
    assert.deepEqual([body.get('client_id'), body.get('assertion'), body.get('resource')], ['c1', 'a.b.c', 'http://p.test/mcp-server'])
    assert.equal(body.has('scope'), false)
    assert.equal(tokenRequestHeaders('http://p.test')['content-type'], 'application/x-www-form-urlencoded')
  })
  test('the resource is the site\'s platform MCP server, below its MCP path, whatever path the site url carries', () => {
    assert.equal(mcpResource('http://p.test/some/page', '/mcp-server'), 'http://p.test/mcp-server/mcp')
  })
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

test.describe('credentialClaims', () => {
  const claims = { id: 'nhi-abc', name: 'agent', organization: { id: 'test1' }, nhi: 1, exp: 1_700_000_300 }
  const idToken = 'eyJhbGciOiJSUzI1NiJ9.' + Buffer.from(JSON.stringify(claims)).toString('base64url')

  test('reads the claims out of the id_token cookie', () => {
    assert.deepEqual(credentialClaims({ cookie: `id_token=${idToken}; id_token_sign=zzz` }), claims)
  })

  test('finds id_token regardless of position', () => {
    assert.equal(credentialClaims({ cookie: `id_token_sign=zzz; id_token=${idToken}` }).id, 'nhi-abc')
  })

  test('throws when there is no id_token cookie', () => {
    assert.throws(() => credentialClaims({ cookie: 'id_token_sign=zzz' }), /no id_token cookie/)
  })

  test('throws on a cookie that is not a header.payload pair', () => {
    assert.throws(() => credentialClaims({ cookie: 'id_token=nodots' }), /header.payload pair/)
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
    const decoded = credentialClaims({ cookie: cookieHeader })
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
    const decoded = credentialClaims({ cookie: cookieHeader })
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
    err.config = { method: 'post', url: 'http://sd:8080/simple-directory/api/oauth/token', data: JSON.stringify({ client_id: 'nhi-abc', assertion: 'eyJhbGciOiJFUzI1NiJ9.SECRET_ASSERTION.sig' }) }
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

  test('keeps simple-directory\'s status: the session broker tells a rejection from a 429 or an outage by it', () => {
    assert.equal((sanitizeExchangeError(fake()) as any).exchangeStatus, 401)
    // lib-node's interceptor rejects with the response's fields copied onto the error itself
    assert.equal((sanitizeExchangeError(Object.assign(new Error('429 - too many'), { status: 429 })) as any).exchangeStatus, 429)
    assert.equal((sanitizeExchangeError(new Error('connect ECONNREFUSED')) as any).exchangeStatus, undefined)
    // never as `status`, which would become this service's own answer to its caller
    assert.equal((sanitizeExchangeError(fake()) as any).status, undefined)
  })

  test('a form-encoded body is dropped too', () => {
    const err = Object.assign(new Error('Request failed with status code 400'), { status: 400, config: { data: 'grant_type=x&assertion=SECRET' }, response: { status: 400, config: { data: 'assertion=SECRET' } } })
    assert.equal(JSON.stringify(sanitizeExchangeError(err)).includes('SECRET'), false)
    assert.equal(sanitizeExchangeError(err).message.includes('SECRET'), false)
  })

  test('keeps the OAuth error code, nothing else of the body', () => {
    const err = Object.assign(new Error('400 - {"error":"invalid_grant"}'), { status: 400, data: { error: 'invalid_grant', error_description: 'hidden-detail' }, response: { status: 400, data: { error: 'invalid_grant', error_description: 'hidden-detail' } } })
    const sanitized = sanitizeExchangeError(err) as any
    assert.equal(sanitized.exchangeError, 'invalid_grant')
    assert.equal(JSON.stringify({ ...sanitized, message: sanitized.message }).includes('hidden-detail'), false)
  })

  test('the error a token request throws keeps the status and the OAuth code, names the site, and carries no assertion', () => {
    const raw = Object.assign(new Error('400 - {"error":"invalid_grant"}'), { status: 400, data: { error: 'invalid_grant' }, config: { data: 'assertion=SECRET' } })
    const err = tokenRequestError(raw, 'http://p.test') as any
    assert.equal(err.exchangeStatus, 400)
    assert.equal(err.exchangeError, 'invalid_grant')
    assert.match(err.message, /nhi token request failed: .* \(site http:\/\/p\.test\)/)
    assert.equal(JSON.stringify({ ...err, message: err.message }).includes('SECRET'), false)
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

test.describe('sessionNeedsRenewal', () => {
  // A turn may outlast a session: each site's session is exchanged again when it nears its expiry, so a
  // late call in a long turn does not 401. The turn deadline no longer depends on the assertion TTL.
  const t0 = 1_000_000
  test('a fresh session is reused', () => {
    assert.equal(sessionNeedsRenewal(t0, t0), false)
    assert.equal(sessionNeedsRenewal(t0, t0 + (ASSERTION_TTL_SECONDS - SESSION_RENEW_MARGIN_SECONDS) * 1000 - 1), false)
  })

  test('a session within the margin of its expiry is renewed, and so is an expired one', () => {
    assert.equal(sessionNeedsRenewal(t0, t0 + (ASSERTION_TTL_SECONDS - SESSION_RENEW_MARGIN_SECONDS) * 1000), true)
    assert.equal(sessionNeedsRenewal(t0, t0 + ASSERTION_TTL_SECONDS * 1000 * 3), true)
  })

  test('the margin leaves most of the session usable', () => {
    assert.ok(SESSION_RENEW_MARGIN_SECONDS * 2 < ASSERTION_TTL_SECONDS)
  })
})

test.describe('credentialScopes', () => {
  const cookieWith = (payload: object) => `id_token=${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.sig; id_token_sign=x`
  test('reads the scope claim', () => {
    assert.deepEqual(credentialScopes({ cookie: cookieWith({ scope: 'datasets:read applications:read' }) }), ['datasets:read', 'applications:read'])
  })
  test('is undefined for an unrestricted or missing session', () => {
    assert.equal(credentialScopes({ cookie: cookieWith({ id: 'x' }) }), undefined)
    assert.equal(credentialScopes(undefined), undefined)
    assert.equal(credentialScopes({ cookie: 'other=1' }), undefined)
  })
  test('reads the claims of a bearer access token', () => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
    const token = `${b64({ alg: 'ES256', typ: 'at+jwt' })}.${b64({ id: 'nhi1', scope: 'datasets:read' })}.sig`
    assert.deepEqual(credentialClaims({ bearer: token }), { id: 'nhi1', scope: 'datasets:read' })
    assert.deepEqual(credentialScopes({ bearer: token }), ['datasets:read'])
  })
  test('a bearer that is not a jwt has no scopes, and does not throw', () => {
    assert.equal(credentialScopes({ bearer: 'opaque' }), undefined)
  })
})

// The account listing fails for a scoped identity until simple-directory lets it list its own sites.
test.describe('accountPlacement', () => {
  const enrolled = 'https://a.example.org'
  const portal = 'https://portal.example.org'
  test('a listed account offers its other sites as portals', () => {
    assert.deepEqual(accountPlacement(enrolled, enrolled, [enrolled, portal]), { account: [enrolled, portal], portals: [portal], home: 'account' })
    assert.deepEqual(accountPlacement(enrolled, portal, [enrolled, portal]), { account: [enrolled, portal], portals: [enrolled], home: 'account' })
  })
  test('a site outside a listed account is anonymous', () => {
    assert.equal(accountPlacement(enrolled, 'https://other.example.org', [enrolled]).home, 'anonymous')
  })
  test('a failed listing still acts as the agent on its enrolment site, with no portal', () => {
    assert.deepEqual(accountPlacement(enrolled, enrolled, undefined), { account: [enrolled], portals: [], home: 'account' })
  })
  test('a failed listing leaves another site unconfirmed, not foreign', () => {
    assert.deepEqual(accountPlacement(enrolled, portal, undefined), { account: [enrolled], portals: [], home: 'unconfirmed' })
  })
})
