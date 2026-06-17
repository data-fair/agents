/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const mockSettings = {
  providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } } } },
  quotas: defaultQuotas
}

test.describe('Mermaid bounded auto-fix (e2e)', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('a diagram that fails to render is fixed automatically', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', mockSettings)

    // Mermaid rendering is an admin opt-in persisted in localStorage; set it before mount.
    await page.addInitScript(() => localStorage.setItem('agent-chat-mermaid', '1'))

    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    // The mock answers "broken mermaid" with an invalid diagram, then a valid one once the
    // auto-fix resends (its hidden context mentions the diagram "failed to render").
    await page.getByPlaceholder('Type your message...').fill('broken mermaid')
    await page.getByRole('button', { name: 'Send' }).click()

    // The auto-fix turn is sent automatically (no click on the manual button).
    await expect(page.getByText(/fixing it automatically/i)).toBeVisible({ timeout: 15000 })

    // The corrected diagram renders as an SVG (mermaid output), and exactly one auto-fix
    // happened — the bound stops it from looping.
    await expect(page.locator('.assistant-content svg').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/fixing it automatically/i)).toHaveCount(1)
  })
})
