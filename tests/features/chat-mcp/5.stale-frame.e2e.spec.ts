/**
 * A frame that goes away (navigating from the portals manager to a dataset page) must
 * stop offering its tools.
 *
 * The portals manager runs in an iframe and registers its own tools through
 * `useFrameServer`. When the host navigates away that iframe is destroyed: its Vue scope
 * is never disposed, so `FrameServerTransport.close()` never runs and no
 * `mcp-server-stopped` is broadcast. The chat's aggregator must still drop the dead server and its
 * tools: a call to it never answers, and the MCP client raises `-32001 Request timed out`
 * after its 60s default.
 *
 * `chat-stale-frame` dev page reproduces the shape: the host keeps its own live tool
 * (the dataset page's) and mounts a removable frame that exposes `read_portal_form`.
 * `?portals=off` is the direct-to-dataset control.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForPageTools, expectNoPageTool } from '../../support/page-tools.ts'

const USER = 'test-standalone1'

test.describe('Tools from a frame that goes away', () => {
  test.beforeEach(async () => {
    await clean()
    const admin = await superAdmin
    await putMockSettings(admin, `user/${USER}`)
  })

  test('removing the frame removes its tool, and a turn after leaving still reaches the model', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-stale-frame', USER)

    // Discovery is asynchronous: wait until BOTH the live host tool and the one
    // from the removable frame are part of the aggregate.
    await waitForPageTools(page, 'read_dataset_notes', 'read_portal_form')

    // Navigating away destroys the portals iframe document — no Vue scope disposal, no
    // `mcp-server-stopped`.
    await page.getByTestId('leave-portals').click()

    await expectNoPageTool(page, 'read_portal_form')
    await waitForPageTools(page, 'read_dataset_notes')

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()

    // Before the fix this waited out the 60s MCP request timeout and surfaced
    // "MCP error -32001: Request timed out". The mock's `world` IS the model being reached — it is the
    // only thing that can produce it.
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
    await expect(page.locator('.v-alert')).toHaveCount(0)
  })

  test('the same turn reaches the model when the portal frame was never opened', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-stale-frame?portals=off', USER)

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
  })
})
