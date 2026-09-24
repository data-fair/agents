/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { anonymousAx } from '../../support/axios.ts'

const publicUrl = `http://localhost:${process.env.NGINX_PORT}/agents`
const expectedIssuer = `${publicUrl}/api/nhi`

test.describe('NHI issuer endpoints', () => {
  test('the discovery document is public and self-consistent', async () => {
    const res = await anonymousAx.get('/api/nhi/.well-known/openid-configuration')
    assert.equal(res.status, 200)
    // simple-directory's getJwksUri rejects a discovery document whose `issuer` does
    // not match the url it was fetched for, so this equality is load-bearing.
    assert.equal(res.data.issuer, expectedIssuer)
    assert.equal(res.data.jwks_uri, `${expectedIssuer}/jwks`)
  })

  test('the JWKS is public, carries a kid, and never exposes the private scalar', async () => {
    const res = await anonymousAx.get('/api/nhi/jwks')
    assert.equal(res.status, 200)
    assert.equal(Array.isArray(res.data.keys), true)
    assert.equal(res.data.keys.length >= 1, true)
    const [key] = res.data.keys
    assert.equal(key.kty, 'EC')
    assert.equal(key.crv, 'P-256')
    assert.equal(key.use, 'sig')
    assert.ok(key.kid, 'expected a kid so rotation can key on it')
    assert.equal('d' in key, false)
    // the dev private scalar must not appear anywhere in the response
    assert.equal(JSON.stringify(res.data).includes('Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q'), false)
  })

  test('the published key actually verifies an assertion this service signs', async () => {
    const { importJWK, SignJWT, jwtVerify, createLocalJWKSet } = await import('jose')
    const jwks = (await anonymousAx.get('/api/nhi/jwks')).data

    // sign with the dev private key from api/config/development.js
    const priv = { kty: 'EC', crv: 'P-256', x: 'iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig', y: 'nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M', d: 'Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q', kid: 'dev-1', alg: 'ES256' }
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'dev-1' })
      .setIssuer(expectedIssuer)
      .setSubject('autonomous-agent:probe')
      .setAudience(`http://localhost:${process.env.NGINX_PORT}`)
      .setIssuedAt()
      .setExpirationTime('300s')
      .sign(await importJWK(priv, 'ES256'))

    // verifying against the PUBLISHED jwks proves the endpoint serves the matching half
    const { payload } = await jwtVerify(jwt, createLocalJWKSet(jwks), {
      issuer: expectedIssuer,
      audience: `http://localhost:${process.env.NGINX_PORT}`,
      subject: 'autonomous-agent:probe'
    })
    assert.equal(payload.sub, 'autonomous-agent:probe')
  })
})
