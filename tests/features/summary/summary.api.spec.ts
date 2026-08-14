/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, axios, clean, defaultQuotas, getAnonymousActionToken } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const otherUser = await axiosAuth('test1-user1')

const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }
const assistantOnly = {
  models: [{ model: mockModel, usage: ['assistant'], multiplier: 0 }],
  modelMapping: { assistant: { provider: 'mock', id: 'mock-model', name: 'Mock Model' } }
}

test.describe('Summary API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('should summarize content with default prompt', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      ...assistantOnly,
      quotas: defaultQuotas
    })

    const res = await user.post('/api/summary/user/test-standalone1', {
      content: 'This is a long piece of text that needs to be summarized. It contains multiple sentences and describes various things that happened during the day.'
    })

    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
    assert.ok(typeof res.data.summary === 'string')
  })

  test('should ignore a caller-supplied prompt (system prompt is pinned)', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      ...assistantOnly,
      quotas: defaultQuotas
    })

    const res = await user.post('/api/summary/user/test-standalone1', {
      prompt: 'Create a bullet-point summary:',
      content: 'First point. Second point. Third point.'
    })

    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })

  // An account with no settings at all still resolves the summarizer through the
  // deployment's global default model (config.defaultModels), so it summarizes
  // instead of 404ing. "Agent not configured" is now reachable only when the
  // deployment itself ships no default for the role.
  test('should fall back to the global default model when nothing is configured', async () => {
    const res = await user.post('/api/summary/user/test-standalone1', { content: 'Test content' })
    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })

  test('should use summarizer model when configured', async () => {
    const summarizerModel = { id: 'summary-model', name: 'Summary Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: [
        { model: mockModel, usage: ['assistant'], multiplier: 0 },
        { model: summarizerModel, usage: ['summarizer'], multiplier: 0 }
      ],
      modelMapping: {
        assistant: { provider: 'mock', id: 'mock-model', name: 'Mock Model' },
        summarizer: { provider: 'mock', id: 'summary-model', name: 'Summary Model' }
      },
      quotas: defaultQuotas
    })

    const res = await user.post('/api/summary/user/test-standalone1', {
      content: 'Test content to summarize'
    })

    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })

  test('should fail when not authenticated', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      ...assistantOnly,
      quotas: defaultQuotas
    })
    const unauthenticatedUser = axios()

    await assert.rejects(
      unauthenticatedUser.post('/api/summary/user/test-standalone1', { content: 'Test content' }),
      (err: any) => err.status === 403
    )
  })

  test('should fail when other user has no permission', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      ...assistantOnly,
      quotas: defaultQuotas
    })

    await assert.rejects(
      otherUser.post('/api/summary/user/test-standalone1', { content: 'Test content' }),
      (err: any) => err.status === 403
    )
  })

  test('external user can summarize when external quota is positive', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      ...assistantOnly,
      quotas: {
        ...defaultQuotas,
        external: { unlimited: false, monthlyLimit: 100 }
      }
    })

    const res = await otherUser.post('/api/summary/user/test-standalone1', {
      content: 'Content to summarize'
    })
    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })

  test('should fail when content is missing', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      ...assistantOnly,
      quotas: defaultQuotas
    })

    await assert.rejects(
      user.post('/api/summary/user/test-standalone1', {}),
      (err: any) => err.status === 400
    )
  })

  test('should handle empty content', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      ...assistantOnly,
      quotas: defaultQuotas
    })

    await assert.rejects(
      user.post('/api/summary/user/test-standalone1', { content: '' }),
      (err: any) => err.status === 400
    )
  })

  const anonSettings = (quotas: any) => ({
    providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
    ...assistantOnly,
    quotas
  })
  const anonQuotas = { ...defaultQuotas, anonymous: { unlimited: false, monthlyLimit: 100 } }

  test('anonymous summary without token is rejected', async () => {
    await putSettings(admin, 'user/test-standalone1', anonSettings(anonQuotas))
    const anon = axios()
    await assert.rejects(
      anon.post('/api/summary/user/test-standalone1', { content: 'Test content' }),
      (err: any) => err.status === 401
    )
  })

  test('anonymous summary with invalid token is rejected', async () => {
    await putSettings(admin, 'user/test-standalone1', anonSettings(anonQuotas))
    const anon = axios()
    await assert.rejects(
      anon.post('/api/summary/user/test-standalone1', { content: 'Test content' }, { headers: { 'x-anonymous-token': 'not-a-real-token' } }),
      (err: any) => err.status === 401
    )
  })

  test('anonymous summary with valid token succeeds', async () => {
    await putSettings(admin, 'user/test-standalone1', anonSettings(anonQuotas))
    const token = await getAnonymousActionToken()
    const anon = axios()
    const res = await anon.post('/api/summary/user/test-standalone1', { content: 'Some content to summarize' }, { headers: { 'x-anonymous-token': token, 'x-forwarded-for': '203.0.113.7' } })
    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })
})
