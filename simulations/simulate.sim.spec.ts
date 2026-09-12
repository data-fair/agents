/**
 * One judged scenario per case. There are no assertions about what the
 * assistant should say — the test fails only when the run itself is invalid
 * (the bridge is down, the page did not load, the turn never finished).
 * Whether the product served the user is the judge's call, from the transcript.
 */
import { test } from '../tests/fixtures/login.ts'
import { findCases } from './cases/index.ts'
import { seedSettings, assertBridgeUp } from './runner/settings.ts'
import { sendMessage, waitForTurn, readConversation } from './runner/chat-driver.ts'
import { captureGateway } from './runner/gateway-capture.ts'
import { nextUserMessage, isDone } from './runner/persona.ts'
import { writeEvidence, type Transcript } from './runner/transcript.ts'
import { clean } from '../tests/support/axios.ts'

const ASSISTANT_MODEL = process.env.SIM_ASSISTANT_MODEL ?? 'sonnet'
const USER_MODEL = process.env.SIM_USER_MODEL ?? 'haiku'
const selected = findCases((process.env.SIM_CASES ?? '').split(',').map(s => s.trim()).filter(Boolean))

for (const simCase of selected) {
  test(`simulation: ${simCase.name}`, async ({ page, goToWithAuth }) => {
    const started = Date.now()
    const consoleErrors: string[] = []
    let turns = 0
    let error: string | undefined

    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    const gateway = captureGateway(page)

    const conversation: Array<{ role: string, text: string }> = []
    try {
      // Setup lives inside the try too: a case that fails to dispatch (bridge
      // down, seeding rejected) must still write an invalid sidecar naming the
      // error, rather than leaving a previous run's evidence on disk to be
      // mistaken for this run's result.
      await assertBridgeUp()
      await clean()
      await seedSettings(ASSISTANT_MODEL)

      await goToWithAuth(simCase.route, 'test-standalone1')
      await page.getByPlaceholder('Type your message...').waitFor({ state: 'visible', timeout: 30000 })

      for (let i = 0; i < simCase.maxTurns; i++) {
        const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i)
        if (isDone(message)) break
        if (message === '') {
          // Distinct from a real stop: the persona subprocess produced no text
          // at all (refusal, swallowed error, empty completion). Recording this
          // as a clean stop would let a judge reason about why the person "left
          // satisfied" when nothing of the sort happened.
          error = `simulated user returned no message (empty completion) on turn ${i + 1}`
          break
        }
        await sendMessage(page, message)
        await waitForTurn(page)
        conversation.length = 0
        conversation.push(...await readConversation(page))
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
      consoleErrors
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
