/**
 * E2E smoke test: explore_tools → promote → call
 *
 * Proves the exploration wiring runs end-to-end in a browser.
 * Turn 1: main mock-model calls explore_tools; the summarizer seam promotes
 * every candidate tool via select_tools.
 * Turn 2: main mock-model calls set_display, which updates the output area.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const mockProvider = { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: mockProvider }
    },
    tools: {
      model: { id: 'mock-tools', name: 'Mock Tools Model', provider: mockProvider }
    },
    summarizer: {
      model: { id: 'mock-summarizer', name: 'Mock Summarizer', provider: mockProvider }
    }
  },
  quotas: defaultQuotas
}

async function sendMessage (page: import('@playwright/test').Page, text: string) {
  const input = page.getByPlaceholder('Type your message...')
  await expect(input).toBeEnabled({ timeout: 10000 })
  await input.fill(text)
  await page.getByRole('button', { name: 'Send' }).click()
}

// The explore-skeleton chip lives in the DOM only between the explore_tools
// tool-call and its tool-result — i.e. for the single mock round-trip of
// explore_tools.execute, which on localhost can be a few milliseconds. Polling
// assertions (toBeVisible) occasionally never sample inside that window and miss
// it. A MutationObserver records the insertion even if the node is added and
// removed within one frame, so the assertion becomes deterministic. Install it
// before the triggering turn; read the flag afterwards.
async function watchForExploreSkeleton (page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const sel = '[data-testid="explore-skeleton"]'
    // The skeleton only ever renders inside .agent-chat, so matching the testid on
    // the added node (or anywhere in its added subtree) is enough.
    const hasSkeleton = (node: Node) =>
      node instanceof Element && (node.matches(sel) || !!node.querySelector(sel))
    const w = window as unknown as { __exploreSkeletonSeen?: boolean, __exploreSkeletonObserver?: MutationObserver }
    w.__exploreSkeletonSeen = !!document.querySelector(`.agent-chat ${sel}`)
    const obs = new MutationObserver(records => {
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (hasSkeleton(node)) w.__exploreSkeletonSeen = true
        }
      }
    })
    obs.observe(document.body, { childList: true, subtree: true })
    w.__exploreSkeletonObserver = obs
  })
}

test.describe('Tool exploration E2E', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('explore_tools promotes tools then set_display updates the output area', async ({ page, goToWithAuth }) => {
    // Enable exploration mode via the `agent-chat-flags` cookie that readFlags()
    // consumes (see ui/src/utils/agent-flags.ts); seed it before the app mounts.
    await page.addInitScript(() => {
      const flags = { toolExploration: true, subAgents: true, mermaid: false }
      document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
    })
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Wait for the input to be ready
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 10000 })

    // Record the transient skeleton via a MutationObserver before triggering the
    // turn, so a fast mock round-trip can't slip the chip in and out between polls.
    await watchForExploreSkeleton(page)

    // Turn 1: trigger explore_tools via the mock "call tool" syntax
    await sendMessage(page, 'call tool explore_tools {"intent":"display some text"}')

    // explore_tools is an internal step: while it runs a placeholder skeleton chip
    // is shown, and the explore_tools name is NEVER rendered as a chip.
    await expect.poll(
      () => page.evaluate(() => (window as unknown as { __exploreSkeletonSeen?: boolean }).__exploreSkeletonSeen === true),
      { timeout: 20000 }
    ).toBe(true)

    // Wait for the full turn 1 response (the assistant text after the tool result).
    // 'done' appears only after explore_tools.execute has finished running
    // (including the summarizer select_tools call that promotes the tools).
    await expect(
      page.locator('.agent-chat .assistant-content').last()
    ).toContainText('done', { timeout: 20000 })

    // The internal explore_tools call is never surfaced as a named chip.
    await expect(page.locator('.agent-chat .v-chip', { hasText: 'explore_tools' })).toHaveCount(0)

    // Turn 2: call set_display – should now be callable (promoted by explore_tools)
    await sendMessage(page, 'call tool set_display {"text":"hello-from-explore"}')

    // The set_display tool writes to the output textarea
    await expect(page.getByLabel('Output')).toHaveValue('hello-from-explore', { timeout: 20000 })
  })

  test('without exploration mode, set_display is called directly and updates the output area', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Exploration mode is NOT enabled (no agent-chat-flags cookie, so toolExploration defaults off)

    // Wait for tools to be registered via MCP before sending – mirrors the waitForToolsReady
    // pattern from chat-subagent.e2e.spec.ts (avoids the race between MCP setup and sendMessage)
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(
      page.locator('.v-dialog .v-window-item--active').getByRole('button', { name: 'set_display' })
    ).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /Close/ }).click()

    // Call set_display directly – no explore_tools involved
    await sendMessage(page, 'call tool set_display {"text":"direct-no-explore"}')

    // The set_display tool writes to the output textarea
    await expect(page.getByLabel('Output')).toHaveValue('direct-no-explore', { timeout: 20000 })
  })
})
