/**
 * Advanced E2E tests for multi-turn sub-agent scenarios.
 *
 * Uses distinct mock models per role:
 *   - mock-model (assistant): standard "hello"→"world" / "call tool" behavior
 *   - mock-tools (tools/subagent): context-aware tool chaining (get_schema → query_data → summary)
 *   - mock-summarizer (summarizer): always returns a fixed summary string
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const mockProvider = { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
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
  // storeTraces is OFF by default so the consent bottom-sheet doesn't overlay the chat
  // in the functionality tests. The review-page tests enable it + grant consent locally.
}

// Poll the stored-trace list API until the conversation for the logged-in user's
// account appears, then return its conversationId. The _dev/chat-subagent page
// drives its gateway as session.account, i.e. user/test-standalone1.
async function pollConversationId (): Promise<string> {
  let conversationId = ''
  for (let i = 0; i < 40; i++) {
    const res = await admin.get('/api/traces/user/test-standalone1?page=1&size=20').catch(() => null)
    if (res && res.data.results.length) { conversationId = res.data.results[0].conversationId; break }
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  return conversationId
}

async function waitForToolsReady (page: import('@playwright/test').Page, toolName: string, locateAsText = false) {
  // The debug dialog has two tabs (Info / Settings); registered tools and
  // sub-agents are listed under the default "Info" tab.
  await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
  const debugContent = page.locator('.v-dialog .v-window-item--active')
  if (locateAsText) {
    await expect(debugContent.getByText(toolName)).toBeVisible({ timeout: 5000 })
  } else {
    await expect(debugContent.getByRole('button', { name: toolName })).toBeVisible({ timeout: 5000 })
  }
  await page.getByRole('button', { name: /Close|Fermer/ }).click()
}

async function sendMessage (page: import('@playwright/test').Page, text: string) {
  const input = page.getByPlaceholder('Type your message...')
  await expect(input).toBeEnabled({ timeout: 10000 })
  await input.fill(text)
  await page.getByRole('button', { name: 'Send' }).click()
}

test.describe('Advanced Sub-Agent Scenarios', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Subagent multi-step tool chain (get_schema → query_data → summary)', async ({ page, goToWithAuth }) => {
    // Live-UI test only: the reconstructed-trace view of sub-agents is covered by
    // "Subagent trace appears on the review page", so this one needs no trace storage.
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // Trigger the sub-agent with a generic task — mock-tools will autonomously chain tools
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"analyze the data"}')

    // Sub-agent expansion panel should appear
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // The mock main-agent appends a trailing "done" reply after the sub-agent's
    // tool result, so this turn "ends on text". Wait for it: once it lands the turn
    // is fully settled and — by design (see AgentChatMessages auto-open logic) — the
    // sub-agent panel has auto-collapsed. Asserting on the auto-expanded panel here
    // would race that collapse against the sub-agent's final text rendering.
    await expect(page.locator('.agent-chat-message .assistant-content').last()).toHaveText('done', { timeout: 15000 })

    // Expand the now-collapsed panel explicitly to inspect the chain it ran.
    const dataAnalystTitle = page.locator('.agent-chat .v-expansion-panel-title', { hasText: 'Data Analyst' }).first()
    await dataAnalystTitle.click()
    await expect(dataAnalystTitle).toHaveClass(/v-expansion-panel-title--active/, { timeout: 5000 })

    const subAgentPanel = page.locator('.agent-chat__subagent-panels').first()

    // get_schema should appear as a tool chip (first step in the chain)
    await expect(subAgentPanel.locator('.v-chip', { hasText: 'get_schema' }).first()).toBeVisible({ timeout: 10000 })

    // The final summary text proves the full chain completed (get_schema → query_data → summary)
    // because mock-tools only returns this text after both tool results are in context
    await expect(subAgentPanel.getByText('Analysis complete')).toBeVisible({ timeout: 10000 })
  })

  test('Subagent works across multiple user messages', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // First call to sub-agent
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Wait for the first response to complete before sending the second
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Second call — subagent should work again in a subsequent message
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')

    // Two sub-agent panels now exist (one per user message): the sub-agent works
    // across multiple messages.
    const subAgentPanels = page.locator('.agent-chat__subagent-panels')
    await expect(subAgentPanels).toHaveCount(2, { timeout: 15000 })

    // Wait for the second response to fully complete.
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // In autoscroll mode a sub-agent panel is auto-closed as soon as a newer
    // message lands behind it. Each turn here ends with a trailing assistant
    // reply, so once both turns are done neither sub-agent panel stays open.
    // (A conversation that *ends* on a sub-agent keeps its panel open — covered
    // by the single-turn tests.)
    await expect(page.locator('.agent-chat .v-expansion-panel-title--active')).toHaveCount(0)
  })

  test('Mixed main agent tools and subagent delegation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'set_display')

    // First: main agent calls set_display
    await sendMessage(page, 'call tool set_display {"text":"step1"}')
    await expect(page.getByLabel('Output')).toHaveValue('step1', { timeout: 15000 })

    // Wait for input to be ready again
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Then: main agent delegates to sub-agent
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Output area should still show the previous value
    await expect(page.getByLabel('Output')).toHaveValue('step1')
  })

  test('Subagent trace appears on the review page', async ({ page, context, goToWithAuth }) => {
    // Enable trace storage for this review-page test + pre-set consent so the
    // conversation is stored server-side and the consent sheet stays hidden.
    await admin.put('/api/settings/user/test-standalone1', { ...settingsData, storeTraces: true })
    await context.addCookies([{ name: 'agent-chat-trace-consent', value: 'yes', domain: 'localhost', path: '/' }])
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // Trigger a sub-agent call
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Wait for response to complete
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Open the stored-trace review page and assert the sub-agent appears. The
    // main-thread subagent_data_analyst call is linked to the sub-agent's stored
    // "sub" requests, producing a "sub-agent-start" entry labelled "data_analyst".
    const conversationId = await pollConversationId()
    expect(conversationId).toBeTruthy()

    await goToWithAuth(`/agents/user/test-standalone1/traces/${conversationId}`, 'test-standalone1')

    const tracePanel = page.locator('.agent-chat__trace-panels')
    await expect(tracePanel).toBeVisible({ timeout: 10000 })
    const subAgentEntry = tracePanel.locator('.v-expansion-panel', { hasText: 'sub-agent-start' })
    await expect(subAgentEntry.first()).toBeVisible({ timeout: 10000 })
    await expect(tracePanel.locator('.v-expansion-panel', { hasText: 'data_analyst' }).first()).toBeVisible({ timeout: 10000 })
  })

  test('Two sub-agents delegated in one step render separate panels concurrently', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    await sendMessage(page, 'parallel subagents')

    const chat = page.locator('.agent-chat')
    // Both panels appear under the same assistant message.
    await expect(chat.getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })
    await expect(chat.getByText('Data Summarizer').first()).toBeVisible({ timeout: 15000 })

    // Turn settles on the trailing main-agent "done" text.
    await expect(chat.getByText('done', { exact: true }).first()).toBeVisible({ timeout: 15000 })

    // Each panel shows its OWN transcript (proves no shared-array clobber).
    const analystPanel = chat.locator('.v-expansion-panel', { hasText: 'Data Analyst' }).first()
    const summarizerPanel = chat.locator('.v-expansion-panel', { hasText: 'Data Summarizer' }).first()
    await analystPanel.locator('.v-expansion-panel-title').click()
    await summarizerPanel.locator('.v-expansion-panel-title').click()
    await expect(analystPanel.getByText('Analysis complete', { exact: false })).toBeVisible({ timeout: 5000 })
    await expect(summarizerPanel.getByText('Summary', { exact: false })).toBeVisible({ timeout: 5000 })
  })

  test('Compaction works during subagent conversation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    // Set low compaction threshold and enable trace
    await page.evaluate(() => {
      sessionStorage.setItem('agent-chat-compaction-threshold', '100')
      sessionStorage.setItem('agent-chat-trace', '1')
    })
    await page.reload()
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // First message to build history
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Second message should trigger compaction (history > 100 chars)
    // Using "hello" so the mock-model assistant responds "world" after compaction
    await sendMessage(page, 'hello')
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Conversation should still be functional after compaction
    await sendMessage(page, 'hello')
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
  })
})
