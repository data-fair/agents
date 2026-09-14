/**
 * Browser-side interaction with the agents chat.
 *
 * The root is a Page when the chat IS the page (this repo's _dev pages) and a
 * FrameLocator when it is embedded (data-fair, portals — lib-vuetify renders
 * agents' own UI in an iframe, so the selectors are identical either way).
 *
 * Turn completion is detected from the composer button, not from message text:
 * AgentChatInput renders a Stop button while streaming and a Send button
 * otherwise. Waiting for text would end the turn at the first token of a
 * multi-step tool conversation.
 */
import { expect, type Page, type FrameLocator } from '@playwright/test'

export type ChatRoot = Page | FrameLocator

const INPUT = 'Type your message...'

// The app's own watchdog is a 90s IDLE timer that re-arms per stream part, so a
// legitimate multi-step turn has no fixed ceiling on total time. This bounds the
// harness generously rather than recording a slow-but-working turn as a failure.
export const TURN_TIMEOUT_MS = 10 * 60 * 1000

export function createChatDriver (root: ChatRoot) {
  return {
    async sendMessage (text: string) {
      await root.getByPlaceholder(INPUT).fill(text)
      await root.getByRole('button', { name: 'Send' }).click()
    },

    async waitForTurn (timeoutMs = TURN_TIMEOUT_MS) {
      const stop = root.getByRole('button', { name: 'Stop' })
      // The turn may already be finished by the time we look, so a missing Stop
      // button is not an error — only one that never goes away is.
      await stop.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      await expect(stop).toHaveCount(0, { timeout: timeoutMs })
    },

    async readConversation () {
      // evaluateAll, not page.evaluate: FrameLocator has no evaluate, and this
      // runs in the right frame's context either way while preserving document order.
      return await root.locator('.agent-chat__user-bubble, .assistant-content').evaluateAll(els =>
        els.map(el => ({
          role: el.classList.contains('agent-chat__user-bubble') ? 'user' as const : 'assistant' as const,
          text: (el.textContent ?? '').trim()
        }))
      )
    }
  }
}
