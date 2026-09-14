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
 *
 * The composer's strings are locale-dependent; `readConversation`'s are not.
 * Pass the locale the host application runs in — the default is English.
 */
import { expect, type Page, type FrameLocator } from '@playwright/test'

export type ChatRoot = Page | FrameLocator

export type ChatDriverLocale = 'fr' | 'en'

/**
 * The chat takes its locale from the session (`i18n_lang`), so a host
 * application running in French renders a French composer. These are the only
 * locale-dependent selectors: `readConversation` matches on classes.
 */
const STRINGS: Record<ChatDriverLocale, { input: string, send: string, stop: string }> = {
  en: { input: 'Type your message...', send: 'Send', stop: 'Stop' },
  fr: { input: 'Tapez votre message...', send: 'Envoyer', stop: 'Arrêter' }
}

export function chatDriverStrings (locale: ChatDriverLocale) {
  const strings = STRINGS[locale]
  // Throw rather than fall back: a silent fallback turns a one-word config
  // mistake into a timeout with no diagnosis.
  if (!strings) throw new Error(`unsupported chat locale: ${locale} (have: ${Object.keys(STRINGS).join(', ')})`)
  return strings
}

// The app's own watchdog is a 90s IDLE timer that re-arms per stream part, so a
// legitimate multi-step turn has no fixed ceiling on total time. This bounds the
// harness generously rather than recording a slow-but-working turn as a failure.
export const TURN_TIMEOUT_MS = 10 * 60 * 1000

export function createChatDriver (root: ChatRoot, opts: { locale?: ChatDriverLocale } = {}) {
  const strings = chatDriverStrings(opts.locale ?? 'en')
  return {
    async sendMessage (text: string) {
      await root.getByPlaceholder(strings.input).fill(text)
      await root.getByRole('button', { name: strings.send }).click()
    },

    async waitForTurn (timeoutMs = TURN_TIMEOUT_MS) {
      const stop = root.getByRole('button', { name: strings.stop })
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
