/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { nginxAx } from '../../support/axios.ts'

const publicUrl = `http://localhost:${process.env.NGINX_PORT}/agents`
const expectedIssuer = `${publicUrl}/api/nhi`

test.describe('NHI issuer endpoints', () => {
  test('the discovery document is public and self-consistent', async () => {
    const res = await nginxAx.get('/api/nhi/.well-known/openid-configuration')
    assert.equal(res.status, 200)
    // simple-directory's getJwksUri rejects a discovery document whose `issuer` does
    // not match the url it was fetched for, so this equality is load-bearing.
    assert.equal(res.data.issuer, expectedIssuer)
    assert.equal(res.data.jwks_uri, `${expectedIssuer}/jwks`)
  })

  test('the JWKS is public, carries a kid, and never exposes the private scalar', async () => {
    const res = await nginxAx.get('/api/nhi/jwks')
    assert.equal(res.status, 200)
    assert.equal(Array.isArray(res.data.keys), true)
    assert.equal(res.data.keys.length >= 1, true)
    const [key] = res.data.keys
    assert.equal(key.kty, 'EC')
    assert.equal(key.crv, 'P-256')
    assert.equal(key.use, 'sig')
    assert.ok(key.kid, 'expected a kid so rotation can key on it')
    assert.equal(res.data.keys.some((key: object) => 'd' in key), false)
  })
  // That the published key verifies what this service signs is nhi-exchange.api.spec.ts's real exchange:
  // simple-directory checks the assertion against this JWKS.
})
