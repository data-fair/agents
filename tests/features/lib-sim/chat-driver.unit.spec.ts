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
import { chatDriverStrings, createChatDriver, WAITING_SELECTOR } from '../../../lib-sim/chat-driver.ts'

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

  test('the waiting selector is one AgentChatMessages actually renders', () => {
    // The same drift guard as the composer strings, for the one attribute that
    // tells the harness the assistant has handed control back. Matched on the
    // activity KIND rather than its label, because the label is the model's own
    // words interpolated into a translated string — but that makes it invisible
    // to every other test here, so it is pinned against the component source.
    const source = readFileSync('ui/src/components/agent-chat/AgentChatMessages.vue', 'utf8')
    assert.ok(source.includes('data-testid="chat-activity"'), 'the activity element lost its test id')
    assert.ok(source.includes(':data-activity="activity?.kind"'), 'the activity element no longer exposes its kind')
    // And the kind the selector names is one the activity vocabulary still has.
    const activity = readFileSync('shared/agent-activity.ts', 'utf8')
    assert.match(WAITING_SELECTOR, /data-activity="waiting"/)
    assert.ok(activity.includes("kind: 'waiting'"), "the 'waiting' activity kind is gone")
  })

  test('the in-page surface keeps the composer and the reset button off-limits', () => {
    // Drift guard on the harness side, complementing page-perception's own off-limits tests. The list
    // now lives on the driver, beside the controls it names, so the two cannot disagree about what
    // "the composer" is — which matters more with two different composers. Asserted from the driver's
    // value rather than by scanning the runner's source, which broke the moment the list moved.
    const driver = createChatDriver({} as any)
    const strings = chatDriverStrings('en')
    for (const name of [strings.input, strings.send, strings.stop, strings.reset]) {
      assert.ok(driver.offLimits.includes(name), `${name} must stay off-limits to the persona`)
    }
  })

  test('the autonomous agent surface keeps ITS composer off-limits, in BOTH locales', () => {
    // A new surface with a composer nobody had listed would silently let the persona type its own
    // message into the page and press Send — the harness would then report a conversation the person
    // never had. Asserting the driver's own English literals could not catch that: the list ignored
    // `locale` entirely, so a French run left Send and New conversation reachable.
    //
    // So the labels are read from the PAGE, not restated here. A rename of an i18n value (or a new
    // locale added to the page but not to the driver) fails this test instead of silently handing the
    // persona a control it must not touch.
    const page = readFileSync(new URL('../../../ui/src/pages/[type]/[id]/autonomous-agents/[agentId].vue', import.meta.url), 'utf8')
    const i18n = page.match(/<i18n lang="yaml">([\s\S]*?)<\/i18n>/)?.[1]
    assert.ok(i18n, 'the thread page must still carry an <i18n> block for this test to read')

    for (const locale of ['en', 'fr'] as const) {
      const block = i18n.split(new RegExp(`^${locale}:$`, 'm'))[1]
      assert.ok(block, `the thread page must define the ${locale} locale`)
      const labels = ['composer', 'send', 'newConversation'].map(key => {
        const value = block.match(new RegExp(`^\\s+${key}:\\s*(.+)$`, 'm'))?.[1]?.trim()
        assert.ok(value, `the thread page must define ${locale}.${key}`)
        return value
      })
      const driver = createChatDriver({} as any, { surface: 'autonomous-agent', locale })
      for (const label of labels) {
        assert.ok(
          driver.offLimits.includes(label),
          `${locale}: "${label}" is a control on the thread page, so it must be off-limits (have: ${driver.offLimits.join(', ')})`
        )
      }
    }
  })

  test('an unknown surface is refused rather than silently treated as the default', () => {
    // A typo in a case would otherwise drive the wrong composer and time out with no diagnosis.
    assert.throws(() => createChatDriver({} as any, { surface: 'autonomus-agent' as any }))
  })
})

// A fake ChatRoot recording every call, in the style of page-perception's
// spyRoot: plain object literals matching only the surface sendMessage uses
// (getByPlaceholder, getByRole, locator), no real Playwright involved.
const fakeSendRoot = (opts: { failAttempts?: number, neverTaken?: boolean } = {}) => {
  const calls: string[] = []
  let attempt = 0
  const failAttempts = opts.failAttempts ?? 0
  let value = ''
  const composer = {
    fill: async (text: string) => { calls.push(`fill:${text}`); value = text },
    // The chat empties its composer when it takes a message; neverTaken keeps it full.
    inputValue: async () => value
  }
  const sendButton = {
    // The composer can only take a message once the send control is actually a
    // Send button — while the assistant works it is Stop — so sendMessage waits
    // for it before clicking. A real Locator has waitFor; the fake needs it too.
    waitFor: async () => { calls.push('waitFor:send') },
    click: async () => {
      attempt++
      if (attempt <= failAttempts) {
        calls.push(`click:${attempt}:fail`)
        throw new Error('element is outside of the viewport')
      }
      calls.push(`click:${attempt}:ok`)
      if (!opts.neverTaken) value = ''
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
    assert.deepEqual(calls, ['fill:hello', 'waitFor:send', 'click:1:ok'])
  })

  test('when the first attempt fails, Escape is pressed and the send is retried once', async () => {
    const { root, calls } = fakeSendRoot({ failAttempts: 1 })
    const chat = createChatDriver(root as any)
    await chat.sendMessage('hello')
    assert.deepEqual(calls, ['fill:hello', 'waitFor:send', 'click:1:fail', 'press:Escape', 'fill:hello', 'waitFor:send', 'click:2:ok'])
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
    assert.deepEqual(calls, ['fill:hello', 'waitFor:send', 'click:1:fail', 'press:Escape', 'fill:hello', 'waitFor:send', 'click:2:fail'])
  })

  test('a click the chat never took is an error, not a sent message', async () => {
    const { root } = fakeSendRoot({ neverTaken: true })
    const chat = createChatDriver(root as any)
    await assert.rejects(() => chat.sendMessage('hello'), /never sent/)
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
