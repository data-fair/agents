/**
 * Browser-side interaction with the agents chat.
 *
 * Turn completion is detected from the composer button, not from message text:
 * AgentChatInput renders a Stop button while `isStreaming` and a Send button
 * otherwise. Waiting for text would end the turn at the first token of a
 * multi-step tool conversation.
 */
import { expect, type Page } from '@playwright/test'

const INPUT = 'Type your message...'
// Above any turn the app itself considers alive: the app's watchdog is a 90s IDLE
// timer that re-arms on every stream part, so a legitimate multi-step sub-agent
// turn can run far longer than its wall-clock look. Four minutes recorded such
// turns as invalid runs; the sim config allows 15 minutes per test, so 10 leaves
// room for the sidecar to be written.
export const TURN_TIMEOUT_MS = 10 * 60 * 1000

export async function sendMessage (page: Page, text: string) {
  await page.getByPlaceholder(INPUT).fill(text)
  await page.getByRole('button', { name: 'Send' }).click()
}

export async function waitForTurn (page: Page, timeoutMs = TURN_TIMEOUT_MS) {
  const stop = page.getByRole('button', { name: 'Stop' })
  // The turn may already be finished by the time we look (a refusal, a cached
  // answer), so a missing Stop button is not an error — only a Stop button that
  // never goes away is.
  await stop.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  await expect(stop).toHaveCount(0, { timeout: timeoutMs })
}

export async function readConversation (page: Page) {
  return await page.evaluate(() => {
    const out: Array<{ role: 'user' | 'assistant', text: string }> = []
    for (const el of document.querySelectorAll('.agent-chat__user-bubble, .assistant-content')) {
      const role = el.classList.contains('agent-chat__user-bubble') ? 'user' as const : 'assistant' as const
      out.push({ role, text: (el.textContent ?? '').trim() })
    }
    return out
  })
}
