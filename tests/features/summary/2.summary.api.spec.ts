/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, axios, clean } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const otherUser = await axiosAuth('test1-user1')

const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

test.describe('Summary API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('should summarize content with default prompt', async () => {
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      chatModel: mockModel
    })

    const res = await user.post('/api/summary', {
      content: 'This is a long piece of text that needs to be summarized. It contains multiple sentences and describes various things that happened during the day.'
    })

    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
    assert.ok(typeof res.data.summary === 'string')
  })

  test('should summarize content with custom prompt', async () => {
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      chatModel: mockModel
    })

    const res = await user.post('/api/summary', {
      prompt: 'Create a bullet-point summary:',
      content: 'First point. Second point. Third point.'
    })

    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })

  test('should fail when chatModel not configured', async () => {
    await assert.rejects(
      user.post('/api/summary', { content: 'Test content' }),
      (err: any) => err.status === 404
    )
  })

  test('should use summaryModel when configured', async () => {
    const summaryModel = { id: 'summary-model', name: 'Summary Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      chatModel: mockModel,
      summaryModel
    })

    const res = await user.post('/api/summary', {
      content: 'Test content to summarize'
    })

    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })

  test('should fail when not authenticated', async () => {
    const unauthenticatedUser = axios()

    await assert.rejects(
      unauthenticatedUser.post('/api/summary', { content: 'Test content' }),
      (err: any) => err.status === 401
    )
  })

  test('should fail when other user has no settings configured', async () => {
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      chatModel: mockModel
    })

    await assert.rejects(
      otherUser.post('/api/summary', { content: 'Test content' }),
      (err: any) => err.status === 404
    )
  })

  test('should fail when content is missing', async () => {
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      chatModel: mockModel
    })

    await assert.rejects(
      user.post('/api/summary', {}),
      (err: any) => err.status === 400
    )
  })

  test('should handle empty content', async () => {
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      chatModel: mockModel
    })

    await assert.rejects(
      user.post('/api/summary', { content: '' }),
      (err: any) => err.status === 400
    )
  })
})
