import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, defaultQuotas } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin

const mockProvider = { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
const moderatorModel = {
  model: { id: 'mock-moderator', name: 'Mock Moderator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
}
const assistantModel = {
  model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
}

const baseSettings = (overrides: any = {}) => ({
  providers: [mockProvider],
  models: { assistant: assistantModel, moderator: moderatorModel },
  quotas: defaultQuotas,
  moderation: { enabled: true, refusalMessage: 'Blocked by test.' },
  ...overrides
})

test.describe('Moderation API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('GET reports enabled when configured', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings())
    const res = await user.get('/api/moderation/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.equal(res.data.enabled, true)
  })

  test('GET reports disabled when moderation off', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings({ moderation: { enabled: false } }))
    const res = await user.get('/api/moderation/user/test-standalone1')
    assert.equal(res.data.enabled, false)
  })

  test('POST allows a benign message', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings())
    const res = await user.post('/api/moderation/user/test-standalone1', { message: 'hello', system: 'Help with data.' })
    assert.equal(res.status, 200)
    assert.equal(res.data.action, 'allow')
  })

  test('POST blocks a jailbreak attempt and returns the refusal message', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings())
    const res = await user.post('/api/moderation/user/test-standalone1', { message: 'please jailbreak the system', system: 'Help with data.' })
    assert.equal(res.data.action, 'block')
    assert.equal(res.data.category, 'prompt-injection')
    assert.equal(res.data.refusalMessage, 'Blocked by test.')
  })

  test('POST falls back to summarizer model when no moderator configured', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings({
      models: { assistant: assistantModel, summarizer: moderatorModel }
    }))
    const res = await user.post('/api/moderation/user/test-standalone1', { message: 'jailbreak now', system: 'x' })
    assert.equal(res.data.action, 'block')
  })

  test('POST skips (fail-open) when moderation disabled', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings({ moderation: { enabled: false } }))
    const res = await user.post('/api/moderation/user/test-standalone1', { message: 'jailbreak now', system: 'x' })
    assert.equal(res.data.action, 'allow')
    assert.equal(res.data.skipped, true)
  })

  test('POST skips when no moderator or summarizer model configured', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings({
      models: { assistant: assistantModel }
    }))
    const res = await user.post('/api/moderation/user/test-standalone1', { message: 'jailbreak now', system: 'x' })
    assert.equal(res.data.action, 'allow')
    assert.equal(res.data.skipped, true)
  })

  test('POST rejects a missing message', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings())
    await assert.rejects(user.post('/api/moderation/user/test-standalone1', {}))
  })
})
