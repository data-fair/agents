/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForPageTools } from '../../support/page-tools.ts'

const admin = await superAdmin

test.describe('Chat MCP UI', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('Page loads, and the debug dialog shows the declared tool inputSchema', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Chat MCP Dev', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Data')).toBeVisible()

    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()

    // Expand the tool panel to reveal the inputSchema (discovery is asynchronous, hence the timeout).
    const tool = page.getByTestId('page-tools').getByText('set_data', { exact: true })
    await expect(tool).toBeVisible({ timeout: 10000 })
    await tool.click()

    // The schema the page declared is not empty - it should contain the "data" property
    const schemaBlock = page.getByTestId('page-tools').locator('.agent-chat__pre').last()
    await expect(schemaBlock).toBeVisible()
    await expect(schemaBlock).toContainText('"properties"')
    await expect(schemaBlock).toContainText('"data"')
  })

  test('Agent can call set_data tool', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    // Wait for tools to be discovered via BroadcastChannel before sending a message
    await waitForPageTools(page, 'set_data')

    await page.getByPlaceholder('Type your message...').fill('call tool set_data {"data":"Hello World"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // THE CLAIM, end to end in a browser: `set_data` exists only in this page; the loop on the server
    // asked for it over the socket, this page ran it, and the textarea changed.
    await expect(page.getByLabel('Data')).toHaveValue('Hello World', { timeout: 10000 })

    // The structure arrived too, not just the side effect: the call renders as a finished tool chip
    // (titled by the page's own tool title, in its done colour).
    const chip = page.getByTestId('tool-chip').filter({ hasText: 'Data' })
    await expect(chip).toHaveCount(1, { timeout: 10000 })
    await expect(chip).toHaveClass(/text-success/)

    // In the order it happened: the mock answers "done" after the call, so its text shows below the chip,
    // not above it as when every call was gathered at the end of the turn.
    const answer = page.locator('.assistant-content').filter({ hasText: 'done' })
    await expect(answer).toHaveCount(1, { timeout: 10000 })
    const chipFirst = await chip.evaluate((el, text) => !!(el.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING), await answer.elementHandle())
    expect(chipFirst).toBe(true)
  })

  test('A turn runs on the server and streams into the page, and Reset clears it', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()

    // The mock answers "hello" with "world": the socket carried the prompt, the executor ran the turn
    // as the personal assistant, and its tokens were streamed back to this page.
    await expect(page.locator('.assistant-content').last()).toHaveText('world', { timeout: 15000 })

    await page.getByRole('button', { name: /Reset conversation|Réinitialiser la conversation/ }).click()

    await expect(page.locator('.assistant-content')).toHaveCount(0)
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
  })
})
