/**
 * The driver types into a placeholder and reads turn completion off the Send /
 * Stop button, all matched by their visible text. The chat renders those in the
 * session's locale, so a host application running in French needs French
 * strings — and a mismatch surfaces as an opaque "element not found" rather
 * than as a locale problem, which is why the table is asserted here.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chatDriverStrings, createChatDriver } from '../../../lib-sim/chat-driver.ts'

test.describe('chat driver composer strings', () => {
  test('serves the French strings', () => {
    assert.deepEqual(chatDriverStrings('fr'), {
      input: 'Tapez votre message...',
      send: 'Envoyer',
      stop: 'Arrêter',
      reset: 'Réinitialiser la conversation'
    })
  })

  test('serves the English strings', () => {
    assert.deepEqual(chatDriverStrings('en'), {
      input: 'Type your message...',
      send: 'Send',
      stop: 'Stop',
      reset: 'Reset conversation'
    })
  })

  test('names the locales it has when given one it does not', () => {
    // Silently falling back to English would send every simulation in a French
    // host repo into a 15-minute timeout with nothing to explain it.
    assert.throws(
      () => chatDriverStrings('de' as never),
      /unsupported chat locale: de/
    )
  })

  test('every composer string in the table is one AgentChatInput actually renders', () => {
    // The drift guard. AgentChatInput.vue is where input/send/stop come from; a
    // reword there and not here breaks every host repo's simulations at once,
    // and no other test in this suite would notice.
    const source = readFileSync('ui/src/components/agent-chat/AgentChatInput.vue', 'utf8')
    for (const locale of ['fr', 'en'] as const) {
      const { input, send, stop } = chatDriverStrings(locale)
      for (const [key, value] of Object.entries({ input, send, stop })) {
        assert.ok(source.includes(value), `${locale}.${key}: "${value}" is not in AgentChatInput.vue`)
      }
    }
  })

  test('reset string in the table is the one AgentChatHeader actually renders', () => {
    // Same drift guard as above, for the header's "Reset conversation" button —
    // a different component, hence a different source file to check against.
    const source = readFileSync('ui/src/components/agent-chat/AgentChatHeader.vue', 'utf8')
    for (const locale of ['fr', 'en'] as const) {
      const { reset } = chatDriverStrings(locale)
      assert.ok(source.includes(reset), `${locale}.reset: "${reset}" is not in AgentChatHeader.vue`)
    }
  })

  test('the runner keeps the reset button off-limits to the persona', () => {
    // Drift guard on the harness side, complementing page-perception's own
    // off-limits tests: the runner is where the actual list is assembled, and
    // a future edit dropping `strings.reset` from it would silently let the
    // persona wipe the transcript mid-run, with nothing here to catch it.
    const source = readFileSync('simulations/simulate.sim.spec.ts', 'utf8')
    const offLimitsLine = source.match(/offLimits:\s*\[[^\]]*\]/)?.[0]
    assert.ok(offLimitsLine, 'could not find the offLimits array in simulate.sim.spec.ts')
    assert.match(offLimitsLine!, /strings\.reset/)
  })
})

// A fake ChatRoot recording every call, in the style of page-perception's
// spyRoot: plain object literals matching only the surface sendMessage uses
// (getByPlaceholder, getByRole, locator), no real Playwright involved.
const fakeSendRoot = (opts: { failAttempts?: number } = {}) => {
  const calls: string[] = []
  let attempt = 0
  const failAttempts = opts.failAttempts ?? 0
  const composer = { fill: async (text: string) => { calls.push(`fill:${text}`) } }
  const sendButton = {
    click: async () => {
      attempt++
      if (attempt <= failAttempts) {
        calls.push(`click:${attempt}:fail`)
        throw new Error('element is outside of the viewport')
      }
      calls.push(`click:${attempt}:ok`)
    }
  }
  const body = { press: async (key: string) => { calls.push(`press:${key}`) } }
  const root = {
    getByPlaceholder: () => composer,
    getByRole: () => sendButton,
    locator: () => body
  }
  return { root, calls }
}

test.describe('sendMessage: bounded, honest recovery from a wedged composer', () => {
  test('succeeds normally without ever pressing Escape', async () => {
    const { root, calls } = fakeSendRoot()
    const chat = createChatDriver(root as any)
    await chat.sendMessage('hello')
    assert.deepEqual(calls, ['fill:hello', 'click:1:ok'])
  })

  test('when the first attempt fails, Escape is pressed and the send is retried once', async () => {
    const { root, calls } = fakeSendRoot({ failAttempts: 1 })
    const chat = createChatDriver(root as any)
    await chat.sendMessage('hello')
    assert.deepEqual(calls, ['fill:hello', 'click:1:fail', 'press:Escape', 'fill:hello', 'click:2:ok'])
  })

  test('when both attempts fail, the error names the composer/modal situation and carries the underlying error', async () => {
    const { root, calls } = fakeSendRoot({ failAttempts: 2 })
    const chat = createChatDriver(root as any)
    await assert.rejects(
      () => chat.sendMessage('hello'),
      (err: unknown) => {
        assert.ok(err instanceof Error)
        assert.match(err.message, /composer/i)
        assert.match(err.message, /modal|scrolled/i)
        assert.match(err.message, /element is outside of the viewport/, 'the underlying Playwright error is included')
        return true
      }
    )
    assert.deepEqual(calls, ['fill:hello', 'click:1:fail', 'press:Escape', 'fill:hello', 'click:2:fail'])
  })

  test('never forces through — no force option on the click/fill calls', () => {
    // A static check alongside the behavioural ones above: forcing a click on
    // an element a real user could not reach would make the harness report
    // successes a person could never have had. Checked against actual code
    // lines, not comments — the file explains this same rule in prose above
    // the retry, which would otherwise make this assertion self-matching.
    const codeLines = readFileSync('lib-sim/chat-driver.ts', 'utf8')
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
    assert.ok(!/force\s*:\s*true/.test(codeLines), 'sendMessage must not punch through an overlay with force:true')
  })
})
