/**
 * Host events end to end, on the _dev/chat-workflow page with the mock model:
 * retained state at activation, events in the next turn, events appended to the causing
 * tool's result, and wait_for_user_action resuming the same turn on the next event.
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

test.describe('Host events', () => {
  test.beforeEach(async () => {
    await clean()
    const admin = await superAdmin
    await admin.put(`/api/settings/user/${USER}`, mockSettings)
  })

  async function open (page: any, goToWithAuth: any) {
    await goToWithAuth('/agents/_dev/chat-workflow', USER)
    // Discovery is asynchronous; a turn sent before the page tools land would be built
    // with an empty tool set (same guard as 3.live-tools.e2e.spec.ts).
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.getByRole('button', { name: 'select_type' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()
  }

  async function send (page: any, text: string) {
    await page.getByPlaceholder('Type your message...').fill(text)
    await page.getByRole('button', { name: 'Send' }).click()
  }

  const lastAnswer = (page: any) => page.locator('.assistant-content').last()

  async function reachConfirmation (page: any) {
    await page.getByRole('button', { name: 'Note', exact: true }).click()
    await page.getByLabel('Title').fill('Weekly groceries')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible()
  }

  function countGatewayRequests (page: any) {
    let n = 0
    page.on('request', (r: any) => { if (r.url().includes('/chat/completions')) n++ })
    return () => n
  }

  test('retained state reaches the model at activation', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await send(page, 'where am i')
    await expect(lastAnswer(page)).toContainText('state:', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('location: {"path":"/workflow"}')
    await expect(lastAnswer(page)).toContainText('wizard: {"step":"type","type":"none","title":""}')
  })

  test('a user action between turns arrives coalesced in the next turn, without any tool call', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await send(page, 'hello')
    await expect(lastAnswer(page)).toContainText('world', { timeout: 15000 })
    await page.getByRole('button', { name: 'Note', exact: true }).click()
    await page.getByLabel('Title').fill('Weekly groceries')
    await send(page, 'what happened')
    await expect(lastAnswer(page)).toContainText('events:', { timeout: 15000 })
    // Clicking Note and filling the title each push a keyed `wizard` event; coalescing
    // must collapse them into ONE line carrying the LAST value, not one line per event —
    // so assert the collapse itself (exactly one `wizard:` line) and the stale
    // intermediate value's absence, not just that the final value is present somewhere.
    await expect(lastAnswer(page)).toContainText('wizard: {"step":"title","type":"note","title":"Weekly groceries"}', { timeout: 15000 })
    const answerText = await lastAnswer(page).innerText()
    expect(answerText.match(/wizard:/g)).toHaveLength(1)
    expect(answerText).not.toContain('wizard: {"step":"title","type":"note","title":""}')
    await expect(page.getByTestId('tool-chip')).toHaveCount(0)
  })

  test('events caused by a tool call ride in that tool result', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await send(page, 'select note')
    await expect(lastAnswer(page)).toContainText('Tool said: Type set to note.', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('wizard: {"step":"title","type":"note","title":""}')
  })

  test('wait_for_user_action resumes the same turn when the user clicks Create', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    const requests = countGatewayRequests(page)
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for: you to click Create', { timeout: 15000 })
    await expect(page.getByTestId('tool-chip')).toContainText('Waiting for: you to click Create')
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(lastAnswer(page)).toContainText('You did:', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('item-created: {"id":"item-')
    await expect(lastAnswer(page)).toContainText('"title":"Weekly groceries"')
    await expect(page.getByTestId('workflow-detail')).toBeVisible()
    // One user message, two model requests: the tool call, then the continuation.
    expect(requests()).toBe(2)
  })

  test('a wait resolves with the departure when the user leaves the page', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })
    await page.getByRole('button', { name: 'Leave page' }).click()
    await expect(lastAnswer(page)).toContainText('You did:', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('location: {"path":"/elsewhere"}')
    await expect(page.getByPlaceholder('Type your message...')).toBeEditable()
  })

  test('a wait times out with the plain text and the turn ends', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait briefly')
    await expect(lastAnswer(page)).toContainText('No user action within 1 seconds', { timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toHaveCount(0)
  })

  test('the idle watchdog does not fire while a wait is pending', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    // Shrink the idle watchdog well below how long we're about to sit in the wait
    // (the default wait timeout is two minutes). A pending wait produces no stream
    // parts by design, so if the watchdog were still armed during it — the bug this
    // guards against — it would fire during the pause below and abort the whole
    // turn with the generic timeout error instead of leaving the wait pending.
    await page.evaluate(() => sessionStorage.setItem('agent-chat-idle-timeout', '1000'))
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for: you to click Create', { timeout: 15000 })
    // Sit well past the shrunk idle timeout while the wait is still pending.
    await page.waitForTimeout(2500)
    // Still waiting, no timeout error alert: the watchdog did not fire during the pause.
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for: you to click Create')
    await expect(page.locator('.v-alert')).toHaveCount(0)
    // The wait still resolves normally afterwards.
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(lastAnswer(page)).toContainText('You did:', { timeout: 15000 })
  })

  test('Stop cancels a pending wait', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })
    await page.getByRole('button', { name: /Stop|Arrêter/ }).click()
    await expect(page.getByTestId('chat-activity')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  })

  test('reset re-activates: the retained state is sent again', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await send(page, 'hello')
    await expect(lastAnswer(page)).toContainText('world', { timeout: 15000 })
    await page.getByRole('button', { name: 'Reset conversation' }).click()
    await send(page, 'where am i')
    await expect(lastAnswer(page)).toContainText('state:', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('location: {"path":"/workflow"}')
  })
})
