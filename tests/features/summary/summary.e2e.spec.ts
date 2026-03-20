/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth } from '../../support/axios.ts'

test.describe('Summary UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Page loads with Summary Dev title', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Summary Dev', level: 1 })).toBeVisible()
  })

  test('Can submit content and see summary result', async ({ page, goToWithAuth }) => {
    const user = await axiosAuth('test-standalone1')
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } } } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    })

    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')

    await page.getByLabel('Content to summarize').fill('This is a test content that needs to be summarized. It contains multiple sentences describing various things.')
    await page.getByRole('button', { name: 'Summarize' }).click()

    await expect(page.getByRole('heading', { name: 'Summary', level: 2 })).toBeVisible()
  })

  test('Can use custom prompt', async ({ page, goToWithAuth }) => {
    const user = await axiosAuth('test-standalone1')
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } } } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    })

    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')

    await page.getByLabel('Content to summarize').fill('Some content to summarize.')
    await page.getByLabel('Optional prompt').fill('Create a short version:')
    await page.getByRole('button', { name: 'Summarize' }).click()

    await expect(page.getByRole('heading', { name: 'Summary', level: 2 })).toBeVisible()
  })

  test('Shows error when assistant model not configured', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')

    await page.getByLabel('Content to summarize').fill('Test content')
    await page.getByRole('button', { name: 'Summarize' }).click()

    await expect(page.getByText('Agent not configured')).toBeVisible()
  })

  test('Button is disabled when content is empty', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')

    const button = page.getByRole('button', { name: 'Summarize' })
    await expect(button).toBeDisabled()
  })
})
