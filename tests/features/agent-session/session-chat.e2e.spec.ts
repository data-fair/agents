/**
 * The server-side loop, driven from a real browser.
 *
 * The api specs prove the protocol with a Node client. This proves the half that only a browser can:
 * a page registers WebMCP tools, the aggregator discovers them over BroadcastChannel exactly as the
 * in-browser loop does, their descriptors travel up the socket, and the loop running on the API server
 * CALLS THEM — operating this page from the other end of the connection.
 *
 * It also takes the first-token reading §7 asks for, which needs a real browser to be meaningful.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Session chat on a dev page', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a turn runs on the server and streams into the page', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/session-chat', 'test1-admin1', { org: 'test1' })
    const state = page.getByTestId('session-state')
    await expect(state).toHaveAttribute('data-attached', 'yes', { timeout: 20000 })

    await page.getByTestId('composer').locator('textarea').fill('hello')
    await page.getByTestId('send').click()

    // The mock answers "hello" with "world". Arriving here at all means: the socket carried the
    // prompt, the executor ran a turn as the personal assistant, and its tokens were streamed back.
    await expect(page.getByTestId('assistant-text')).toHaveText('world', { timeout: 20000 })

    // Reading 2 of §7, measured where it is meaningful: in a browser, from pressing send to the first
    // token. Asserted only as a sane bound — the number itself is reported in the spec.
    const firstToken = await state.getAttribute('data-first-token-ms')
    expect(Number(firstToken)).toBeGreaterThan(0)
    expect(Number(firstToken)).toBeLessThan(10000)
    console.log(`[reading] first token: ${firstToken} ms`)
  })

  test('the server calls a tool that only exists in this page', async ({ page, goToWithAuth }) => {
    // THE CLAIM, end to end and in a browser. `set_data` is a WebMCP tool registered by this page and
    // reachable nowhere else; the loop on the server asks for it over the socket, this page runs it,
    // and the textarea changes. Nothing about the WebMCP side was modified to make this work.
    await goToWithAuth('/agents/_dev/session-chat', 'test1-admin1', { org: 'test1' })
    const state = page.getByTestId('session-state')
    await expect(state).toHaveAttribute('data-attached', 'yes', { timeout: 20000 })
    // The aggregator has to have DISCOVERED the page's tool before the prompt goes, or the loop is
    // told the page offers nothing and the model's call fails as an unknown tool. Waiting on the
    // declared count rather than on a sleep: discovery is BroadcastChannel plus an MCP connect and
    // listTools, so it is slower than the HTTP call that creates the conversation.
    await expect(state).toHaveAttribute('data-tools', '1', { timeout: 20000 })

    await page.getByTestId('composer').locator('textarea').fill('call tool set_data {"data":"written by the server"}')
    await page.getByTestId('send').click()

    await expect(page.getByTestId('tool-data').locator('textarea')).toHaveValue('written by the server', { timeout: 20000 })
    await expect(state).toHaveAttribute('data-tool-calls', '1')

    // The STRUCTURE arrived too, not just the side effect: the page learned which tool ran and that it
    // finished, through the same parts-to-ChatMessage mapper a reopened thread uses. This is what makes
    // a real transcript drivable from the socket — tool chips, states and all — without a second format.
    await expect(state).toHaveAttribute('data-tool-chips', 'set_data:done', { timeout: 20000 })
    // And it arrived WHILE the turn ran, not only at the end. Without this the assertion above passes
    // on the final frame alone — which is how it first survived removing the in-turn one.
    await expect(state).toHaveAttribute('data-saw-pending', 'yes')
  })
})
