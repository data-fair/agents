/**
 * One judged scenario per case. There are no assertions about what the
 * assistant should say — the test fails only when the run itself is invalid
 * (the bridge is down, the page did not load, the turn never finished).
 * Whether the product served the user is the judge's call, from the transcript.
 */
import { test } from '../tests/fixtures/login.ts'
import { cases } from './cases/index.ts'
import { seedSettings, assertBridgeUp, seedAutonomousAgent, parseAutonomousAgentRoute, fetchConversationExports, runPlannedTaskRepeatedly, fetchTaskRunExport, fetchAgentMemory, OWNER } from './runner/settings.ts'
import {
  createChatDriver,
  nextUserMessage, isDone, resolveUserModel, NEW_CONVERSATION_ROLE,
  writeEvidence, type TranscriptInput, parseConversationExport,
  selectCases,
  createPagePerception
} from '@data-fair/lib-agents-sim'
import { clean } from '../tests/support/axios.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../ui/src/review/review-consent.ts'

const ASSISTANT_MODEL = process.env.SIM_ASSISTANT_MODEL ?? 'sonnet'
// The memory, compaction and moderation roles, pinned separately and lower:
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
    // Cast rather than annotated: it is assigned inside converse(), which control-flow analysis does
    // not follow, so an annotated `let` read after the call would be narrowed to `undefined`.
    let perception = undefined as ReturnType<typeof createPagePerception> | undefined
    // Set by an unattended case: the runs it started, whose exports are the whole of its evidence.
    let taskRuns: { agentId: string, runIds: string[] } | undefined

    /** The chat half of a case: a person, a page, and turns until they are done or out of turns. */
    const converse = async () => {
      // OWNER, not a literal: seedSettings configures that account, and logging in
      // as anyone else would fail every case with "no provider configured".
      // A case may name its own user: one driving an existing autonomous agent needs someone who may
      // instruct it, which the seeded owner is not.
      // Into the agent's ORGANIZATION when it has one: a role is resolved against the session's active
      // account, so an instructor left on their personal account counted as `external` to the agent's
      // org — the role its quotas and moderation key on.
      await goToWithAuth(simCase.route, user, owner.type === 'organization' ? { org: owner.id } : undefined)
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
      const perceived = createPagePerception(
        simCase.embedded
          ? [{ label: 'page', root: page }, { label: 'chat panel', root: page.frameLocator('iframe') }]
          : [{ label: 'page', root: page }],
        { offLimits: chat.offLimits }
      )
      perception = perceived

      // Set when the assistant ended a turn by handing control to the person rather than by
      // finishing — a wait_for_user_action, or a call stopped for their approval: the person only
      // exists inside nextUserMessage, so the next pass is where they act on it.
      let handedOver = false

      // A case may span several conversations (memory outliving one is the reason). `conversation`
      // keeps them all, in order; `closed` is how many of its entries belong to conversations already
      // ended, so the screen — which only ever shows the current one — replaces only the rest.
      const conversations = simCase.conversations ?? 1
      let current = 1
      let closed = 0
      const showOnScreen = (read: Array<{ role: string, text: string }>) => {
        conversation.length = closed
        conversation.push(...read)
      }

      for (let i = 0; i < simCase.maxTurns; i++) {
        perceived.setTurn(i + 1)
        const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i, { perception: perceived })
        if (handedOver) {
          // The pass above was the person's chance to act on the handover. If they took it,
          // the assistant is finishing the turn it paused (or, for an approval, the turn their
          // decision started): let it, rather than speaking over it or ending the run under it.
          // Ignored, it is still pending and this returns at once — after the driver's short look
          // for a Stop button, for an approval, since nothing is running then.
          handedOver = (await chat.waitForTurn()) !== 'ended'
          const resumed = await chat.readConversation()
          const changed = resumed.length !== conversation.length - closed
          showOnScreen(resumed)
          // Whatever the person wrote in that pass, they wrote it before the reply their
          // action caused: a judged run ended on the click, others sent "what was just
          // created?" under the very message that said so, interrupting the next wait.
          // Drop it and let them read the reply first — stopping included.
          if (changed) continue
        }
        if (isDone(message)) {
          if (current >= conversations) break
          // DONE ends THIS conversation; the case asked for another. Opened by the runner, as the
          // composer is sent by it: the reset button is off-limits to the persona. The boundary is
          // an entry of the transcript, so the person (persona.ts), the judge and the metrics all
          // read one record in order.
          await chat.newConversation()
          current++
          conversation.push({ role: NEW_CONVERSATION_ROLE, text: `you opened a new conversation (${current} of ${conversations}); the chat is empty again` })
          closed = conversation.length
          handedOver = false
          continue
        }
        if (message === '') {
          // Distinct from a real stop: the persona subprocess produced no text
          // at all (refusal, swallowed error, empty completion). Recording this
          // as a clean stop would let a judge reason about why the person "left
          // satisfied" when nothing of the sort happened.
          error = `simulated user returned no message (empty completion) on turn ${i + 1}`
          break
        }
        await chat.sendMessage(message)
        handedOver = (await chat.waitForTurn()) !== 'ended'
        // Read first, then replace: clearing up front meant a throw from
        // readConversation left the transcript empty, losing every prior turn.
        showOnScreen(await chat.readConversation())
        // Counted only once the turn is actually reflected in the transcript,
        // so a throw from sendMessage/waitForTurn/readConversation does not
        // inflate the sidecar's turn count past what the transcript shows.
        turns++
      }
    }

    try {
      // Setup lives inside the try too: a case that fails to dispatch (bridge
      // down, seeding rejected) must still write an invalid sidecar naming the
      // error, rather than leaving a previous run's evidence on disk to be
      // mistaken for this run's result.
      await assertBridgeUp()
      await clean()
      if (simCase.surface === 'autonomous-agent' || simCase.surface === 'unattended') {
        owner = parseAutonomousAgentRoute(simCase.route).owner
        await seedSettings(ASSISTANT_MODEL, TOOLS_MODEL, owner)
        // Seeded here rather than assumed present: `npm run dev-fixtures` would be an unstated
        // prerequisite, and its agent lives on an account deliberately wired to the mock model.
        await seedAutonomousAgent(simCase.route, user, simCase.agent)
      } else {
        await seedSettings(ASSISTANT_MODEL, TOOLS_MODEL)
      }

      if (simCase.surface === 'unattended') {
        // NOBODY IN THE LOOP: no page is opened and no persona is asked anything — a planned task's
        // run has no chat and no person, and simulating one would test a situation the product never
        // has. The runner plays the admin pressing "run now" and waits for the run to end; the route
        // only names the agent. Thrown when the case is malformed, so it is reported, not skipped.
        if (!simCase.task) throw new Error('an unattended case must declare the task it runs')
        // `runs`: the same task run again, as successive weekly slots would — what memory is for.
        const { runs, agentId } = await runPlannedTaskRepeatedly(simCase.route, simCase.task, simCase.runs ?? 1)
        taskRuns = { agentId, runIds: runs.map(run => run.id) }
      } else {
        await converse()
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
      // A task run is not a conversation and is not listed with them: its export is read by the run's
      // own route, in the same format.
      if (simCase.surface === 'unattended') {
        // Oldest first, as conversations are: a premise about memory reads which run came first.
        for (const runId of taskRuns?.runIds ?? []) exports.push(await fetchTaskRunExport(owner, taskRuns!.agentId, runId))
      } else {
        exports = await fetchConversationExports(owner, user)
      }
    } catch (err) {
      evidenceErrors.push(`could not export the run's conversations: ${err instanceof Error ? err.message : String(err)}`)
    }
    // What the agent remembers at the end, and who wrote each change: no export carries it.
    let hostState: TranscriptInput['hostState']
    const memoryAgentId = taskRuns?.agentId ?? (simCase.surface === 'autonomous-agent' ? parseAutonomousAgentRoute(simCase.route).agentId : undefined)
    if (memoryAgentId) {
      try {
        const memory = await fetchAgentMemory(owner, memoryAgentId)
        if (memory) hostState = { agentMemory: memory }
      } catch (err) {
        evidenceErrors.push(`could not read the agent's memory: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // A run that never reached the situation its case is about tested nothing, however it went: invalid,
    // so it is reported and not judged. Only checked on an otherwise valid run with its evidence in hand.
    if (!error && simCase.premise && !evidenceErrors.length) {
      try {
        if (!simCase.premise.holds(exports.map(parseConversationExport))) error = `premise not met: ${simCase.premise.description}`
      } catch (err) {
        evidenceErrors.push(`could not check the premise: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    const transcript: TranscriptInput = {
      case: simCase.name,
      // Present when not the default, so a judge reading 'unattended' knows the empty conversation is
      // nobody having been there, not a person who never spoke.
      ...(simCase.surface ? { surface: simCase.surface } : {}),
      goal: simCase.goal,
      persona: simCase.persona,
      route: simCase.route,
      conversation,
      consoleErrors,
      observations: perception?.observations ?? [],
      exports,
      ...(evidenceErrors.length ? { evidenceErrors } : {}),
      ...(hostState ? { hostState } : {})
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
