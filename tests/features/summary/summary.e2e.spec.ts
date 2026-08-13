/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

test.describe('Summary UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Page loads with Summary Dev title', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Summary Dev', level: 1 })).toBeVisible()
  })

  test('Can submit content and see summary result', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } },
          usage: ['assistant'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')

    await page.getByLabel('Content to summarize').fill('This is a test content that needs to be summarized. It contains multiple sentences describing various things.')
    await page.getByRole('button', { name: 'Summarize' }).click()

    await expect(page.getByRole('heading', { name: 'Summary', level: 2 })).toBeVisible()
  })

  // An account with no settings of its own still summarizes: the deployment's
  // global default model covers the summarizer role. (The former "Agent not
  // configured" error is now reachable only when the deployment ships no
  // default for the role.)
  test('Summarizes with no account settings, using the global default model', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')

    await page.getByLabel('Content to summarize').fill('Test content')
    await page.getByRole('button', { name: 'Summarize' }).click()

    await expect(page.getByRole('heading', { name: 'Summary', level: 2 })).toBeVisible()
  })

  test('Button is disabled when content is empty', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')

    const button = page.getByRole('button', { name: 'Summarize' })
    await expect(button).toBeDisabled()
  })
})
