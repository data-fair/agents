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
 * application running in French renders a French composer. `reset` is the
 * header's "Reset conversation" icon button (AgentChatHeader.vue) — its
 * accessible name comes from the same `t()`-into-`title` pattern as the
 * composer's own strings, so it is sourced here rather than as a literal at
 * the call site. These are the only locale-dependent selectors:
 * `readConversation` matches on classes.
 */
const STRINGS: Record<ChatDriverLocale, { input: string, send: string, stop: string, reset: string }> = {
  en: { input: 'Type your message...', send: 'Send', stop: 'Stop', reset: 'Reset conversation' },
  fr: { input: 'Tapez votre message...', send: 'Envoyer', stop: 'Arrêter', reset: 'Réinitialiser la conversation' }
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

// Bounds a wedged page — e.g. the persona's own click/look/type tools
// (page-perception.ts) left an overlay open over the composer — so a stuck
// send fails in seconds rather than retrying against a stable-but-unreachable
// element until the test runner's own timeout kills the whole case 15 minutes
// later with no diagnosis. Unrelated to TURN_TIMEOUT_MS, which bounds a
// legitimately long model turn once the message has actually been sent.
export const SEND_TIMEOUT_MS = 15000

export function createChatDriver (root: ChatRoot, opts: { locale?: ChatDriverLocale } = {}) {
  const strings = chatDriverStrings(opts.locale ?? 'en')
  return {
    async sendMessage (text: string) {
      const fillAndSend = async () => {
        await root.getByPlaceholder(strings.input).fill(text, { timeout: SEND_TIMEOUT_MS })
        await root.getByRole('button', { name: strings.send }).click({ timeout: SEND_TIMEOUT_MS })
      }
      try {
        await fillAndSend()
      } catch {
        // Not { force: true }: punching through an overlay a real user could
        // not reach would make the harness report successes a person could
        // never have had. Escape is the ordinary way a person dismisses a
        // dialog that is in their way, so try that and retry once — on a
        // locator, not `root.keyboard`, since root is a FrameLocator (no
        // keyboard) when the chat is embedded.
        await root.locator('body').press('Escape', { timeout: SEND_TIMEOUT_MS }).catch(() => {})
        try {
          await fillAndSend()
        } catch (secondErr) {
          const detail = secondErr instanceof Error ? secondErr.message : String(secondErr)
          throw new Error(
            'could not operate the chat composer (fill/send) even after pressing Escape — ' +
            `the page may have been left in a modal or scrolled state by the simulated user. Underlying error: ${detail}`
          )
        }
      }
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
