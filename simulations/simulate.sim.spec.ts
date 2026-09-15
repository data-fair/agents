/**
 * One judged scenario per case. There are no assertions about what the
 * assistant should say — the test fails only when the run itself is invalid
 * (the bridge is down, the page did not load, the turn never finished).
 * Whether the product served the user is the judge's call, from the transcript.
 */
import { test } from '../tests/fixtures/login.ts'
import { cases } from './cases/index.ts'
import { seedSettings, assertBridgeUp, OWNER } from './runner/settings.ts'
import {
  createChatDriver,
  chatDriverStrings,
  captureGateway,
  nextUserMessage, isDone,
  writeEvidence, type Transcript,
  selectCases,
  createPagePerception
} from '@data-fair/lib-agents-sim'
import { clean } from '../tests/support/axios.ts'

const ASSISTANT_MODEL = process.env.SIM_ASSISTANT_MODEL ?? 'sonnet'
const USER_MODEL = process.env.SIM_USER_MODEL ?? 'haiku'
const selected = selectCases(cases, (process.env.SIM_CASES ?? '').split(',').map(s => s.trim()).filter(Boolean))

for (const simCase of selected) {
  test(`simulation: ${simCase.name}`, async ({ page, goToWithAuth }) => {
    const started = Date.now()
    const consoleErrors: string[] = []
    let turns = 0
    let error: string | undefined

    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    const gateway = captureGateway(page)

    const conversation: Array<{ role: string, text: string }> = []
    let perception: ReturnType<typeof createPagePerception> | undefined
    try {
      // Setup lives inside the try too: a case that fails to dispatch (bridge
      // down, seeding rejected) must still write an invalid sidecar naming the
      // error, rather than leaving a previous run's evidence on disk to be
      // mistaken for this run's result.
      await assertBridgeUp()
      await clean()
      await seedSettings(ASSISTANT_MODEL)

      // OWNER, not a literal: seedSettings configures that account, and logging in
      // as anyone else would fail every case with "no provider configured".
      await goToWithAuth(simCase.route, OWNER.id)
      const root = simCase.embedded ? page.frameLocator('iframe') : page
      // Single source of truth for the composer's locale-dependent strings: the
      // chat driver and the perception's off-limits list must agree on exactly
      // what "the composer" is called, or the guard could miss it.
      const locale = 'en' as const
      const strings = chatDriverStrings(locale)
      const chat = createChatDriver(root, { locale })
      await root.getByPlaceholder(strings.input).waitFor({ state: 'visible', timeout: 30000 })

      // A person sees the whole viewport, not one frame: when the chat is embedded,
      // the persona looks at both the host page and the frame.
      // offLimits: the composer belongs to the runner, not the persona — see
      // spec §3. Refusing these names structurally is what stops the persona
      // from typing its message into the page and pressing Send itself.
      // `strings.reset` is off-limits for a different reason: it is not the
      // product surface under test, it is this harness's own recording — a
      // mid-run click erases the transcript the run exists to produce, and no
      // verdict could survive that. That is unlike an ordinary control such as
      // Settings, which a real user can open and which chat-driver.ts's
      // Escape-and-retry is what makes survivable — Settings (and every other
      // ordinary product control) stays reachable to the persona.
      perception = createPagePerception(
        simCase.embedded
          ? [{ label: 'page', root: page }, { label: 'chat panel', root: page.frameLocator('iframe') }]
          : [{ label: 'page', root: page }],
        { offLimits: [strings.input, strings.send, strings.stop, strings.reset] }
      )

      for (let i = 0; i < simCase.maxTurns; i++) {
        perception.setTurn(i + 1)
        const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i, { perception })
        if (isDone(message)) break
        if (message === '') {
          // Distinct from a real stop: the persona subprocess produced no text
          // at all (refusal, swallowed error, empty completion). Recording this
          // as a clean stop would let a judge reason about why the person "left
          // satisfied" when nothing of the sort happened.
          error = `simulated user returned no message (empty completion) on turn ${i + 1}`
          break
        }
        await chat.sendMessage(message)
        await chat.waitForTurn()
        // Read first, then replace: clearing up front meant a throw from
        // readConversation left the transcript empty, losing every prior turn.
        const read = await chat.readConversation()
        conversation.length = 0
        conversation.push(...read)
        // Counted only once the turn is actually reflected in the transcript,
        // so a throw from sendMessage/waitForTurn/readConversation does not
        // inflate the sidecar's turn count past what the transcript shows.
        turns++
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }

    const transcript: Transcript = {
      case: simCase.name,
      goal: simCase.goal,
      persona: simCase.persona,
      route: simCase.route,
      conversation,
      gateway,
      consoleErrors,
      observations: perception?.observations ?? []
    }
    writeEvidence(simCase.name, transcript, {
      case: simCase.name,
      valid: !error,
      error,
      assistantModel: ASSISTANT_MODEL,
      userModel: USER_MODEL,
      turns,
      durationMs: Date.now() - started,
      finishedAt: new Date().toISOString()
    })

    // An invalid run must never be judged, so surface it as a test failure.
    if (error) throw new Error(`run invalid: ${error}`)
  })
}
