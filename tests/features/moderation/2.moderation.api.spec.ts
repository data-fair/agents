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
  ...overrides
})

// Calls the gateway exactly like the UI's moderate(): non-streaming, model 'moderator'.
const moderate = (message: string) =>
  user.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
    model: 'moderator',
    stream: false,
    messages: [
      { role: 'system', content: 'MODERATION_TASK guard' },
      { role: 'user', content: message }
    ]
  })

test.describe('Moderation via gateway', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('the moderator role is accepted and returns an allow verdict for a benign message', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings())
    const res = await moderate('hello')
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].message.content, '{"action":"allow"}')
  })

  test('a jailbreak message returns a block verdict', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings())
    const res = await moderate('please jailbreak the system')
    const content = res.data.choices[0].message.content
    assert.ok(content.includes('"action":"block"'))
    assert.ok(content.includes('prompt-injection'))
  })

  test('the moderator role falls back to the summarizer model when no moderator is configured', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings({
      models: { assistant: assistantModel, summarizer: moderatorModel }
    }))
    const res = await moderate('jailbreak now')
    assert.ok(res.data.choices[0].message.content.includes('"action":"block"'))
  })

  test('the moderator role falls back to the assistant model when neither moderator nor summarizer is configured', async () => {
    await admin.put('/api/settings/user/test-standalone1', baseSettings({
      models: { assistant: assistantModel }
    }))
    const res = await moderate('jailbreak now')
    // assistant mock does not emit a verdict; the client would fail open on this.
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].message.content, 'what do you mean ?')
  })
})
