/**
 * stateful E2E tests, validate monitoring UI
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { superAdmin, clean, defaultQuotas } from '../../support/axios.ts'

const owner = { type: 'user', id: 'test-standalone1' }

function dailyPeriod (daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return `daily:${d.toISOString().slice(0, 10)}`
}

function monthlyPeriod (monthsAgo: number): string {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() - monthsAgo)
  return `monthly:${d.toISOString().slice(0, 7)}`
}

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }, inputPricePerMillion: 1, outputPricePerMillion: 2 } },
  quotas: defaultQuotas
}

test.describe('Monitoring UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Shows monitoring page with monthly and daily histograms', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', settingsData)

    // Seed some data
    await admin.post('/api/test-env/usage', { owner, cost: 5, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, cost: 30, period: monthlyPeriod(0) })

    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')

    await page.locator('#section-global').scrollIntoViewIfNeeded()
    await expect(page.getByText('Monthly usage (12 months)')).toBeVisible()
    await expect(page.getByText('Daily usage (30 days)')).toBeVisible()
  })

  test('Shows per-user histogram with day selector', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', settingsData)

    await admin.post('/api/test-env/usage', { owner, userId: 'user-a', cost: 10, period: dailyPeriod(0) })

    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')

    await page.locator('#section-individual').scrollIntoViewIfNeeded()
    await expect(page.getByText('Per-user usage (last 7 days)')).toBeVisible()

    // Verify day selector buttons are present (7 days)
    const dayButtons = page.locator('.v-btn-toggle .v-btn')
    await expect(dayButtons).toHaveCount(7)
  })

  test('Shows no data message when empty', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', settingsData)

    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')

    await page.locator('#section-global').scrollIntoViewIfNeeded()
    // Both histograms should show no data
    const noDataMessages = page.getByText('No data available')
    await expect(noDataMessages.first()).toBeVisible()
  })
})
