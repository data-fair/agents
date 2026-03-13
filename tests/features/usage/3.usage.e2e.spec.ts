/**
 * stateful E2E tests, validate usage UI
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean } from '../../support/axios.ts'

test.describe('Usage UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Shows usage card on settings page', async ({ page, goToWithAuth }) => {
    const user = await axiosAuth('test-standalone1')

    // Seed settings
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    })

    await goToWithAuth('/agents/settings', 'test-standalone1')

    // Verify usage card title is visible
    await expect(page.getByText('Usage', { exact: true })).toBeVisible()
    // With no usage, should show "No usage recorded"
    await expect(page.getByText('No usage recorded')).toBeVisible()
  })

  test('Shows no usage message when no requests made', async ({ page, goToWithAuth }) => {
    const user = await axiosAuth('test-standalone1')
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    })

    await goToWithAuth('/agents/settings', 'test-standalone1')

    await expect(page.getByText('No usage recorded')).toBeVisible()
  })
})
