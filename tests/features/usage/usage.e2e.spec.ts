/**
 * stateful E2E tests, validate usage UI
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { superAdmin, clean, defaultQuotas } from '../../support/axios.ts'

test.describe('Usage UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Shows usage card on settings page', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin

    // Seed settings
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
          usage: ['assistant'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })

    // Verify usage card title is visible
    await expect(page.getByText('Usage', { exact: true })).toBeVisible()
    // With no usage, should show "No usage recorded"
    await expect(page.getByText('No usage recorded')).toBeVisible()
  })

  test('Shows no usage message when no requests made', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
          usage: ['assistant'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })

    await expect(page.getByText('No usage recorded')).toBeVisible()
  })
})
