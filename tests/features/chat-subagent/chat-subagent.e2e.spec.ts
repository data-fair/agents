/**
 * E2E tests for the sub-agent chat page.
 *
 * The mock model responds to:
 *   "hello"                          → "world"
 *   "call tool <name> <json-args>"   → tool call
 *   anything else                    → "what do you mean ?"
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForPageTools } from '../../support/page-tools.ts'

const admin = await superAdmin

// Seed the flags cookie before boot so each test pins its own sub-agent render
// mode. goToWithAuth reuses a cached browser context, so a path=/ cookie set by
// one test leaks into the next — every rendering test must seed explicitly.
const seedFlagsCookie = (page: Page, simpleSubAgents: boolean) => page.addInitScript((simple) => {
  const flags = { mermaid: false, simpleSubAgents: simple }
  document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
}, simpleSubAgents)
// Full v-alert panel rendering (to inspect the inner sub-agent trace).
const seedFullPanelCookie = (page: Page) => seedFlagsCookie(page, false)
// Simplified chip rendering (the product default).
const seedChipCookie = (page: Page) => seedFlagsCookie(page, true)

test.describe('Chat Sub-Agent UI', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('Page loads with correct title and UI elements', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Chat Sub-Agent Dev', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Output')).toBeVisible()
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
  })

  test('All tools are discovered via MCP', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // The tools, the sub-agent and the tools it reserves all reach the aggregate.
    await waitForPageTools(page, 'set_display', 'subagent_data_analyst', 'get_schema', 'query_data')
  })

  test('The debug dialog shows the tools the server offered on the last turn', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForPageTools(page, 'set_display', 'subagent_data_analyst')

    // Before any turn there is no server record to show.
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await expect(page.getByTestId('offered-tools-empty')).toBeVisible()
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // The record is read when the dialog opens, and the call record is written fire-and-forget, so
    // open it until the turn's tools show up: what the model was actually offered.
    await expect(async () => {
      await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
      try {
        const offered = page.getByTestId('offered-tools')
        await expect(offered).toContainText('set_display', { timeout: 1500 })
        await expect(offered).toContainText('subagent_data_analyst', { timeout: 1500 })
      } finally {
        await page.getByRole('button', { name: /Close|Fermer/ }).click()
      }
    }).toPass({ timeout: 15000 })
  })

  test('Main agent can call set_display tool', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForPageTools(page, 'set_display')

    // Ask the mock model to call set_display
    await page.getByPlaceholder('Type your message...').fill('call tool set_display {"text":"Hello from test"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Verify the output textarea receives the value
    await expect(page.getByLabel('Output')).toHaveValue('Hello from test', { timeout: 15000 })
  })

  test('Main agent delegates to a sub-agent (simplified chip)', async ({ page, goToWithAuth }) => {
    await seedChipCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForPageTools(page, 'subagent_data_analyst', 'get_schema', 'query_data')

    // The sub-agent receives "hello" as task → mock responds "world"
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Default simple mode: the delegation renders as a chip, not a panel.
    await expect(page.getByTestId('subagent-chip').filter({ hasText: 'Data Analyst' }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('subagent-panel')).toHaveCount(0)
  })

  test('Sub-agent can use reserved tools (full panel)', async ({ page, goToWithAuth }) => {
    await seedFullPanelCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForPageTools(page, 'subagent_data_analyst', 'get_schema', 'query_data')

    // Ask the mock model to call the sub-agent with a task that triggers a tool call
    // The sub-agent mock receives "call tool get_schema {}" → calls get_schema
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"call tool get_schema {\\"dataset\\":\\"test\\"}"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // The sub-agent panel appears and is collapsed by default (no auto-open).
    const panel = page.locator('.agent-chat').getByTestId('subagent-panel').first()
    await expect(panel).toBeVisible({ timeout: 15000 })
    await expect(panel.getByTestId('subagent-panel-body')).toBeHidden()

    // Wait for the turn to fully settle (input re-enabled) before expanding.
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Expand manually and verify the reserved get_schema tool chip is inside the body.
    await panel.getByTestId('subagent-panel-header').click()
    const body = panel.getByTestId('subagent-panel-body')
    await expect(body).toBeVisible({ timeout: 5000 })
    await expect(body.locator('.v-chip', { hasText: 'get_schema' }).first()).toBeVisible({ timeout: 5000 })
  })

  test('Sub-agent that loops to its step cap recovers a close-out answer', async ({ page, goToWithAuth }) => {
    await seedFullPanelCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForPageTools(page, 'subagent_data_analyst', 'get_schema', 'query_data')

    // Task "loop forever" makes the sub-agent emit the SAME get_schema call on every
    // step (the mock also ignores the reminder injected at REPEATED_CALL_NUDGE_AT), so
    // the repeated-call guard stops it at REPEATED_CALL_LIMIT long before STEP_LIMIT
    // would — that separation is the point: the step limit is generous so real work
    // fits, the guard catches the runaway. It still finishes on 'tool-calls', so the
    // harness then runs ONE no-tools close-out turn that synthesizes a best-effort
    // answer from what it gathered — instead of discarding the run and reporting a
    // bare truncation.
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"loop forever"}')
    await page.getByRole('button', { name: 'Send' }).click()

    const panel = page.locator('.agent-chat').getByTestId('subagent-panel').first()
    await expect(panel).toBeVisible({ timeout: 20000 })

    // The looping + close-out must terminate the turn (input re-enabled), not hang.
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 20000 })

    // Expand and confirm the recovered close-out answer is rendered in the panel —
    // proving the answer survived the step cap rather than being lost to a notice.
    await panel.getByTestId('subagent-panel-header').click()
    const body = panel.getByTestId('subagent-panel-body')
    await expect(body).toBeVisible({ timeout: 5000 })
    await expect(body.getByText('Closed-out best-effort summary from gathered data.')).toBeVisible({ timeout: 5000 })

    // The guard, not the step limit, is what stopped it: an unguarded run would have
    // spun all the way to STEP_LIMIT (100) instead of REPEATED_CALL_LIMIT (5).
    await expect(body.locator('.v-chip', { hasText: 'get_schema' })).toHaveCount(5, { timeout: 10000 })
  })
})
