/**
 * Admin-mode superadmins may consume any account's gateway (powers cross-account
 * trace evaluation). Non-admins remain bound by their effective role.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, superAdmin, clean, directoryUrl, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin                       // superadmin, adminMode: true
const externalUser = await axiosAuth('test1-user1')  // not a member of test-standalone1

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      inputPricePerMillion: 1,
      outputPricePerMillion: 2
    }
  },
  quotas: defaultQuotas
}

async function gatewayProvider (ax: any, ownerType: string, ownerId: string) {
  const cookie = await ax.cookieJar.getCookieString(directoryUrl)
  return createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/${ownerType}/${ownerId}/v1`,
    apiKey: 'unused',
    headers: { cookie },
    name: 'data-fair-gateway'
  })
}

test.describe('Gateway admin-mode cross-account access', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('admin-mode superadmin consumes a non-member account gateway; usage records on that account', async () => {
    const provider = await gatewayProvider(admin, 'user', 'test-standalone1')
    const result = await generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] })
    assert.equal(result.text, 'world')
    const usage = await admin.get('/api/usage/user/test-standalone1')
    assert.ok(usage.data.monthly.cost > 0, 'usage recorded on the reviewed account owner')
  })

  test('non-admin non-member is rejected (external role, no quota)', async () => {
    const provider = await gatewayProvider(externalUser, 'user', 'test-standalone1')
    await assert.rejects(generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] }))
  })
})
