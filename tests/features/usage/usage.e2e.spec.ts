/**
 * stateful E2E tests, validate usage UI
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { superAdmin, anonymousAx, clean, defaultQuotas } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

// matches api/config/development.js secretKeys.limits
const LIMITS_SECRET = 'secretlimits'

test.describe('Usage UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Shows usage card on settings page', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin

    // Seed settings
    await putSettings(admin, 'user/test-standalone1', {
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
    // An account with no pushed allowance has no cap: limit -1 reads "unlimited"
    await expect(page.getByText('Credits consumed')).toBeVisible()
    await expect(page.getByText('0 / unlimited')).toBeVisible()
  })

  // The org-wide credit allowance pushed by the customers service, as the usage
  // card reads it back from GET /api/usage (its `credits` field).
  test('Shows the pushed credit cap and its consumption', async ({ page, goToWithAuth }) => {
    await anonymousAx.post(`/api/v1/limits/organization/test1?key=${LIMITS_SECRET}`, {
      name: 'Test Organization 1',
      lastUpdate: new Date().toISOString(),
      ai_credits: { limit: 100, consumption: 12 }
    })

    await goToWithAuth('/agents/organization/test1', 'test1-admin1', { org: 'test1' })

    await expect(page.getByText('Credits consumed')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('12 / 100 credits')).toBeVisible()
  })

  test('Shows no usage message when no requests made', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await putSettings(admin, 'user/test-standalone1', {
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
