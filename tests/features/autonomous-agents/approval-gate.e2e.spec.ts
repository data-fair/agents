/**
 * stateful E2E tests: the approval card in the chat, on a configured autonomous agent with the mock model
 * and the MCP fixture.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startTurnOverSocket } from '../../../dev/socket-turn.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin

test.describe('Approval card', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Gate probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  const ask = async (page: any, text: string) => {
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(text)
    await page.getByTestId('agent-chat-send').click()
  }

  test('approving from the card runs the call; the card survives a reload until decided', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool wipe_everything {}')
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    // One name for the call: the label says what the card's heading and the chip say.
    await expect(page.getByTestId('approval-title')).toHaveText('Approve "Wipe everything"?')
    await expect(page.getByTestId('chat-activity')).toHaveText('Awaiting your approval: Wipe everything')
    // A gated catalog call reads as plain language: its tool's description, and its (empty) arguments
    // in words rather than raw JSON.
    const card = page.getByTestId('approval-card')
    await expect(card.getByTestId('approval-description')).toHaveText('Declares destructive annotations, and does nothing')
    await expect(card).toContainText('no arguments')
    expect(await card.innerText()).not.toContain('{')

    await page.reload()
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toHaveText('Awaiting your approval: Wipe everything')

    // Click, then look at the buttons in the same browser task: the server's answer (which removes the
    // card) cannot have arrived yet, so this is the locked state and not a race against it.
    const lockedAfterClick = await page.getByTestId('approval-approve').evaluate(async (button: HTMLButtonElement) => {
      button.click()
      await new Promise(resolve => setTimeout(resolve, 0))
      const reject = document.querySelector('[data-testid="approval-reject"]') as HTMLButtonElement | null
      return button.disabled && !!reject?.disabled
    })
    expect(lockedAfterClick).toBe(true)
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect.poll(() => fixture.invokedTools()).toEqual(['wipe_everything'])
    await expect(page.getByTestId('tool-chip').first()).toHaveText('Approved: Wipe everything', { timeout: 15000 })
  })

  test('the card shows locked while the turn that asked finishes, then becomes decidable without a reload', async ({ page, goToWithAuth }) => {
    // `slow_lookup` holds the step open after the approval request: the server refuses a decision until
    // the turn has closed its message, so the card must not offer one before.
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tools slow_lookup wipe_everything')
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('approval-approve')).toBeDisabled()
    await expect(page.getByTestId('approval-reject')).toBeDisabled()

    await expect(page.getByTestId('approval-approve')).toBeEnabled({ timeout: 15000 })
    await page.getByTestId('approval-approve').click()
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect.poll(() => [...fixture.invokedTools()].sort()).toEqual(['slow_lookup', 'wipe_everything'])
  })

  test('rejecting with a reason leaves a declined chip, and nothing runs', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool wipe_everything {}')
    await page.getByTestId('approval-reject').click({ timeout: 15000 })
    await page.getByTestId('approval-reason').locator('input').fill('not today')
    await page.getByTestId('approval-confirm-reject').click()
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect(page.getByTestId('tool-chip').first()).toHaveText('Declined: Wipe everything')
    expect(fixture.invokedTools()).toEqual([])
  })

  test('the admin review page shows a pending approval read-only', async ({ page, goToWithAuth }) => {
    const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
    const { conversationId } = await startTurnOverSocket(orgAdmin, { agentId }, 'call tool wipe_everything {}')
    await goToWithAuth(`/agents/organization/test1/review/${conversationId}`, 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('approval-title')).toHaveText('Approve "Wipe everything"?')
    await expect(page.getByTestId('approval-readonly')).toHaveText("Awaiting the person's decision")
    await expect(page.getByTestId('approval-approve')).toHaveCount(0)
    await expect(page.getByTestId('approval-reject')).toHaveCount(0)
    expect(fixture.invokedTools()).toEqual([])
  })
})
