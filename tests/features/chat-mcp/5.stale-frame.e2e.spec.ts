/**
 * A frame that goes away (navigating from the portals manager to a dataset page) must
 * stop offering its tools.
 *
 * The portals manager runs in an iframe and registers its own sub-agent tools through
 * `useFrameServer`. When the host navigates away that iframe is destroyed: its Vue scope
 * is never disposed, so `FrameServerTransport.close()` never runs and no
 * `mcp-server-stopped` is broadcast. The chat's aggregator keeps the dead server and its
 * tools; on the next turn `resolveSubAgents` calls each sub-agent tool's execute, the call
 * to the dead server never answers, and the MCP client raises `-32001 Request timed out`
 * after its 60s default — so the completion request is never sent.
 *
 * `chat-stale-frame` dev page reproduces the shape: the host keeps its own live sub-agent
 * (the dataset page's tools) and mounts a removable frame that exposes `Portals config`.
 * `?portals=off` is the direct-to-dataset control.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const mockSettings = {
  providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } } } },
  quotas: defaultQuotas
}

const USER = 'test-standalone1'

test.describe('Tools from a frame that goes away', () => {
  test.beforeEach(async () => {
    await clean()
    const admin = await superAdmin
    await admin.put(`/api/settings/user/${USER}`, mockSettings)
  })

  async function openInfo (page: any) {
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
  }

  async function closeInfo (page: any) {
    await page.getByRole('button', { name: /Close|Fermer/ }).click()
  }

  function countCompletions (page: any) {
    let n = 0
    page.on('request', (r: any) => { if (r.url().includes('/chat/completions')) n++ })
    return () => n
  }

  test('removing the frame removes its sub-agent tool from the aggregate', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-stale-frame', USER)

    // Discovery is asynchronous: wait until BOTH the live host sub-agent and the one
    // from the removable frame are part of the aggregate.
    await openInfo(page)
    await expect(page.getByText('Dataset notes')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Portals config')).toBeVisible({ timeout: 10000 })
    await closeInfo(page)

    // Navigating away destroys the portals iframe document — no Vue scope disposal, no
    // `mcp-server-stopped`.
    await page.getByTestId('leave-portals').click()

    await openInfo(page)
    await expect(page.getByText('Portals config')).toHaveCount(0, { timeout: 5000 })
    await expect(page.getByText('Dataset notes')).toBeVisible()
  })

  test('a turn after leaving the portal page still reaches the model', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-stale-frame', USER)

    await openInfo(page)
    await expect(page.getByText('Portals config')).toBeVisible({ timeout: 10000 })
    await closeInfo(page)

    const completions = countCompletions(page)
    await page.getByTestId('leave-portals').click()
    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()

    // Before the fix this waits out the 60s MCP request timeout and surfaces
    // "MCP error -32001: Request timed out" with zero completion requests.
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
    expect(completions()).toBeGreaterThan(0)
  })

  test('the same turn reaches the model when the portal frame was never opened', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-stale-frame?portals=off', USER)

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
  })
})
