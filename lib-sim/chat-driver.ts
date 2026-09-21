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

/**
 * How a turn ended. `waiting` means the assistant declared
 * `wait_for_user_action` and is holding the turn open for the person — the
 * caller's cue to let them act, then wait again for the turn it resumes.
 */
export type TurnOutcome = 'ended' | 'waiting'

/**
 * Matched on the activity's kind, not its label: the label is the model's own
 * words interpolated into a translated string, so any text match would be both
 * locale-dependent and at the mercy of what the assistant wrote.
 */
/**
 * How long an armed wait must persist before the driver calls it the person's
 * move. Long enough for a resolving wait's indicator to clear, short enough to be
 * nothing against a wait a person is actually thinking through.
 */
export const WAIT_SETTLE_MS = 500

export const WAITING_SELECTOR = '[data-testid="chat-activity"][data-activity="waiting"]'

export function createChatDriver (root: ChatRoot, opts: { locale?: ChatDriverLocale } = {}) {
  const strings = chatDriverStrings(opts.locale ?? 'en')
  return {
    async sendMessage (text: string, opts: { readyTimeoutMs?: number } = {}) {
      const fillAndSend = async () => {
        await root.getByPlaceholder(strings.input).fill(text, { timeout: SEND_TIMEOUT_MS })
        // Wait for the composer to be able to take it. While the assistant is
        // genuinely working the send control IS the Stop button, so there is no
        // Send to click — and a caller that tried anyway spent SEND_TIMEOUT_MS
        // failing, pressed Escape, failed again, and left the text sitting in the
        // box. A judged run lost six of its nine turns exactly so, and read as an
        // assistant that had gone silent. Waiting for the turn is not a wedged
        // page; it is the normal case, so it gets the caller's own ceiling.
        const send = root.getByRole('button', { name: strings.send })
        await send.waitFor({ state: 'visible', timeout: opts.readyTimeoutMs ?? SEND_TIMEOUT_MS })
        await send.click({ timeout: SEND_TIMEOUT_MS })
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

    async waitForTurn (timeoutMs = TURN_TIMEOUT_MS): Promise<TurnOutcome> {
      const stop = root.getByRole('button', { name: strings.stop })
      const waiting = root.locator(WAITING_SELECTOR)
      // The turn may already be finished by the time we look, so a missing Stop
      // button is not an error — only one that never goes away is.
      await stop.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})

      // A turn can finish two ways, and only one of them is the assistant being
      // done. `wait_for_user_action` holds the turn open on purpose, having handed
      // control back to the person — and a simulated person only acts between
      // turns, so a harness that waited for the Stop button alone could never let
      // them act on it. Every declared wait then ran its whole window and was
      // recorded as a wedged turn; at a wait window as long as the harness's own
      // ceiling, that is every run.
      const ended = expect(stop).toHaveCount(0, { timeout: timeoutMs }).then(() => 'ended' as const)
      const armed = expect(waiting).toHaveCount(1, { timeout: timeoutMs }).then(
        // Still armed a moment later, not merely armed at the instant we looked.
        // A wait that the person has just resolved keeps its indicator for as long
        // as the click takes to round-trip, and reporting THAT as "control is
        // yours" hands the caller a turn that is already resuming underneath: the
        // simulation loop then sends into a working turn, where the message used
        // to be dropped in silence. Settling costs half a second on a real wait,
        // which is a pause measured in minutes.
        async () => {
          await waiting.page().waitForTimeout(WAIT_SETTLE_MS)
          if (await waiting.count() === 0) return await new Promise<never>(() => {})
          return 'waiting' as const
        },
        // Never rejects: a wait that is simply not what this turn did must not be
        // the error a caller sees. The Stop arm owns the timeout message.
        () => new Promise<never>(() => {})
      )
      return await Promise.race([ended, armed])
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
