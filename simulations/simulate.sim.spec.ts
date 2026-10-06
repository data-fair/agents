/**
 * One judged scenario per case. There are no assertions about what the
 * assistant should say — the test fails only when the run itself is invalid
 * (the bridge is down, the page did not load, the turn never finished).
 * Whether the product served the user is the judge's call, from the transcript.
 */
import { test } from '../tests/fixtures/login.ts'
import { cases } from './cases/index.ts'
import { seedSettings, assertBridgeUp, seedAutonomousAgent, parseAutonomousAgentRoute, fetchConversationExports, OWNER } from './runner/settings.ts'
import {
  createChatDriver,
  nextUserMessage, isDone, resolveUserModel,
  writeEvidence, type TranscriptInput,
  selectCases,
  createPagePerception
} from '@data-fair/lib-agents-sim'
import { clean } from '../tests/support/axios.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../shared/trace-consent.ts'

const ASSISTANT_MODEL = process.env.SIM_ASSISTANT_MODEL ?? 'sonnet'
// The sub-agent, compaction and moderation roles, pinned separately and lower:
// that is where a deployment puts a small model, so that is where the product
// has to work.
const TOOLS_MODEL = process.env.SIM_TOOLS_MODEL ?? 'haiku'
const USER_MODEL = resolveUserModel()
const selected = selectCases(cases, (process.env.SIM_CASES ?? '').split(',').map(s => s.trim()).filter(Boolean))

for (const simCase of selected) {
  test(`simulation: ${simCase.name}`, async ({ page, goToWithAuth }) => {
    const started = Date.now()
    const consoleErrors: string[] = []
    // An autonomous-agent case drives a thread that belongs to an ORGANIZATION, so the account whose
    // settings must point at the bridge is that one — not OWNER. Both are derived from the case's
    // own route, so the account configured and the page opened cannot drift apart.
    // Parsed inside the try below, so a malformed route is recorded as an invalid run.
    let owner: { type: string, id: string } = OWNER
    const user = simCase.user ?? OWNER.id
    let turns = 0
    let error: string | undefined

    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    // Consent answered up front: the run is read back through the conversation export, which only
    // covers threads the person agreed to have reviewed — and the consent sheet is not what a case is
    // about, so the persona is not asked.
    await page.context().addCookies([{ name: CONSENT_COOKIE, value: CONSENT_YES, url: `http://localhost:${process.env.NGINX_PORT}` }])

    const conversation: Array<{ role: string, text: string }> = []
    let perception: ReturnType<typeof createPagePerception> | undefined
    try {
      // Setup lives inside the try too: a case that fails to dispatch (bridge
      // down, seeding rejected) must still write an invalid sidecar naming the
      // error, rather than leaving a previous run's evidence on disk to be
      // mistaken for this run's result.
      await assertBridgeUp()
      await clean()
      if (simCase.surface === 'autonomous-agent') {
        owner = parseAutonomousAgentRoute(simCase.route).owner
        await seedSettings(ASSISTANT_MODEL, TOOLS_MODEL, owner)
        // Seeded here rather than assumed present: `npm run dev-fixtures` would be an unstated
        // prerequisite, and its agent lives on an account deliberately wired to the mock model.
        await seedAutonomousAgent(simCase.route, user)
      } else {
        await seedSettings(ASSISTANT_MODEL, TOOLS_MODEL)
      }

      // OWNER, not a literal: seedSettings configures that account, and logging in
      // as anyone else would fail every case with "no provider configured".
      // A case may name its own user: one driving an existing autonomous agent needs someone who may
      // instruct it, which the seeded owner is not.
      await goToWithAuth(simCase.route, user)
      const root = simCase.embedded ? page.frameLocator('iframe') : page
      // The driver owns the composer AND the off-limits list, so the two cannot disagree about what
      // "the composer" is called.
      const locale = 'en' as const
      const chat = createChatDriver(root, { locale })
      await chat.prepare()

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
        { offLimits: chat.offLimits }
      )

      // Set when the assistant ended a turn by declaring wait_for_user_action rather
      // than by finishing: it handed control to the person, who only exists inside
      // nextUserMessage — so the next pass is where they act on it.
      let handedOver = false

      for (let i = 0; i < simCase.maxTurns; i++) {
        perception.setTurn(i + 1)
        const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i, { perception })
        if (handedOver) {
          // The pass above was the person's chance to act on the wait. If they took it,
          // the wait resolved and the assistant is finishing the turn it paused: let it,
          // rather than speaking over it or ending the run under it. Ignored, the wait is
          // still armed and this returns 'waiting' at once.
          handedOver = (await chat.waitForTurn()) === 'waiting'
          const resumed = await chat.readConversation()
          const changed = resumed.length !== conversation.length
          conversation.length = 0
          conversation.push(...resumed)
          // Whatever the person wrote in that pass, they wrote it before the reply their
          // action caused: a judged run ended on the click, others sent "what was just
          // created?" under the very message that said so, interrupting the next wait.
          // Drop it and let them read the reply first — stopping included.
          if (changed) continue
        }
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
        handedOver = (await chat.waitForTurn()) === 'waiting'
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

    // Read AFTER the conversation, and outside the try above so an invalid run still carries whatever
    // the agent managed to do — that is usually the most informative part of a failure. Never allowed
    // to turn a good run into a failed one: this is evidence gathering, not a check.
    let exports: TranscriptInput['exports'] = []
    const evidenceErrors: string[] = []
    try {
      exports = await fetchConversationExports(owner, user)
    } catch (err) {
      evidenceErrors.push(`could not export the run's conversations: ${err instanceof Error ? err.message : String(err)}`)
    }

    const transcript: TranscriptInput = {
      case: simCase.name,
      goal: simCase.goal,
      persona: simCase.persona,
      route: simCase.route,
      conversation,
      consoleErrors,
      observations: perception?.observations ?? [],
      exports,
      ...(evidenceErrors.length ? { evidenceErrors } : {})
    }
    writeEvidence(simCase.name, transcript, {
      case: simCase.name,
      valid: !error,
      error,
      assistantModel: ASSISTANT_MODEL,
      toolsModel: TOOLS_MODEL,
      userModel: USER_MODEL,
      turns,
      durationMs: Date.now() - started,
      finishedAt: new Date().toISOString()
    })

    // An invalid run must never be judged, so surface it as a test failure.
    if (error) throw new Error(`run invalid: ${error}`)
  })
}
