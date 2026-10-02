/**
 * stateful API tests: the org-wide credit cap, pushed via the customers ecosystem
 * `/api/v1/limits` endpoint, must stop a turn — ahead of any per-profile quota check.
 *
 * The cap no longer surfaces as an HTTP 429. The gateway was a proxy on the request path, so it could
 * refuse the request itself. The loop is asynchronous now: posting a message always succeeds, and the
 * refusal arrives as the turn's own answer with zero steps taken. ENFORCEMENT is unchanged and still
 * happens before the first model call (`enforceQuotas` in the executor), so a capped account still
 * spends nothing — what changed is who is told, and how.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn } from '../../support/turn.ts'

// matches api/config/development.js secretKeys.limits
const SECRET = 'secretlimits'

const admin = await superAdmin
const test1Admin = await axiosAuth('test1-admin1', { org: 'test1' }) // admin of organization/test1

const settingsData = {
  providers: [
    {
      id: 'mock-provider',
      type: 'mock',
      name: 'Mock Provider',
      enabled: true
    }
  ],
  // pricing is irrelevant here: the org cap is enforced from the pushed
  // limits doc, before any usage/cost is computed from a real call
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 8_000,
      outputPricePerMillion: 8_000
    }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
  },
  quotas: {
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: false, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 },
    untrusted: { unlimited: false, monthlyLimit: 0 }
  }
}

async function pushLimits (limit: number, consumption: number) {
  const res = await test1Admin.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
    name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit, consumption }
  })
  assert.equal(res.status, 200)
}

/** The text of the turn's answer, which is where a refusal now arrives. */
async function lastAssistantText (owner: string, conversationId: string) {
  const res = await test1Admin.get(`/api/autonomous-agent-conversations/${owner}/${conversationId}/messages`)
  const messages = res.data.results as any[]
  const assistant = messages.filter(m => m.role === 'assistant').pop()
  return (assistant?.parts ?? []).filter((part: any) => part.type === 'text').map((part: any) => part.text).join('')
}

test.describe('org credit cap enforcement', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'organization/test1', settingsData)
  })

  test('a turn is refused, naming the account scope, when consumption reaches the pushed limit', async () => {
    await pushLimits(5, 5)

    const { conversationId } = await runTurn(test1Admin, 'organization/test1')
    const text = await lastAssistantText('organization/test1', conversationId)
    // The same three facts the 429 body carried, which is what an admin needs in order to act.
    assert.match(text, /account/)
    assert.match(text, /limit 5/)
    assert.match(text, /used 5/)
  })

  test('nothing is spent when the cap refuses the turn', async () => {
    // The property that actually matters, and the one a message-shaped refusal could get wrong while
    // still reading correctly: a refused turn must not reach the model at all.
    await pushLimits(5, 5)
    const before = (await test1Admin.get('/api/usage/organization/test1')).data.daily.cost

    await runTurn(test1Admin, 'organization/test1')

    const after = (await test1Admin.get('/api/usage/organization/test1')).data.daily.cost
    assert.equal(after, before, 'a capped account must spend nothing')
  })

  test('limit -1 (default) means unlimited', async () => {
    await pushLimits(-1, 999999)

    const { conversationId } = await runTurn(test1Admin, 'organization/test1')
    // The mock answers "world" to "hello": the turn ran rather than being refused.
    assert.equal(await lastAssistantText('organization/test1', conversationId), 'world')
  })

  test('the org cap applies even to a profile whose own quota is unlimited', async () => {
    // test1-admin1 holds the admin profile, which is unlimited, yet the exhausted org-wide cap must
    // still stop the turn. The ORDER the gateway asserted — cap checked before the profile quota —
    // is no longer observable from outside, but the outcome it protected is.
    await pushLimits(5, 5)

    const { conversationId } = await runTurn(test1Admin, 'organization/test1')
    assert.match(await lastAssistantText('organization/test1', conversationId), /account/)
  })

  test('usage endpoint exposes the cap', async () => {
    await pushLimits(42, 7)

    const res = await test1Admin.get('/api/usage/organization/test1')
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.credits, { limit: 42, consumption: 7 })
  })
})
