/**
 * One judged scenario, end to end. There are no assertions about what the
 * assistant should say — the run throws only when it is invalid (the bridge is
 * down, the page did not load, the turn never finished). Whether the product
 * served the person is the judge's call, from the transcript.
 *
 * The host keeps what only it knows: its cases, seeding, login, and which page a
 * case runs on (`setup`), what the person can see (`perceptionRoots`), and how the
 * run's conversations are read back (`fetchExports`).
 */
import type { Locator, Page } from '@playwright/test'
import type { SimulationCase, TranscriptInput } from './types.ts'
import { assertBridgeUp, REVIEW_CONSENT_COOKIE, REVIEW_CONSENT_YES } from './bridge-settings.ts'
import { createChatDriver, chatDriverStrings, type ChatDriverLocale } from './chat-driver.ts'
import { parseConversationExport, runErrors, type ConversationExport } from './conversation-export.ts'
import { createPagePerception, type PerceptionRoot } from './page-perception.ts'
import { nextUserMessage, isDone, resolveUserModel } from './persona.ts'
import { writeEvidence } from './transcript.ts'

/** The agents chat frame, whose src is /agents/<type>/<id>/chat?… — not a bare 'iframe': hosts embed other frames beside it. */
export const CHAT_FRAME = 'iframe[src*="/agents/"][src*="/chat"]'

// Explicit ceiling, not the driver's own 10-minute default: maxTurns × 5 minutes
// stays inside the 45-minute test budget (see defineSimConfig), so a wedged turn
// surfaces as a recorded invalid run rather than an unrecorded test-timeout abort.
// A declared wait does not eat into it: the driver reports an armed wait instead
// of sitting through it.
export const TURN_CEILING_MS = 5 * 60 * 1000

/**
 * The drawer does not survive a full navigation, and the persona may close it.
 * Reopening before every send keeps the run alive so the friction reaches the
 * transcript instead of killing it. Probe first: clicking unconditionally would
 * close a drawer that is already open. Matches lib-vuetify-agents' toggle class.
 */
export async function ensureChatOpen (page: Page, composer: Locator) {
  const visible = (timeout: number) => composer.waitFor({ state: 'visible', timeout }).then(() => true, () => false)
  // 10s, not 2: right after a navigation the open drawer's iframe is still reloading,
  // and a short probe read it as closed — the click then CLOSED the drawer and the run
  // died waiting for a composer the harness itself had hidden.
  if (await visible(10_000)) return
  const toggle = page.locator('.df-agent-chat-toggle').first()
  await toggle.click()
  if (await visible(15_000)) return
  // Still nothing: the probe raced a drawer that was open after all. One more toggle.
  await toggle.click()
  await composer.waitFor({ state: 'visible', timeout: 30_000 })
}

export type SimulationModels = { assistantModel: string, toolsModel: string }

export type SimulationOptions = {
  /** The agents service's base URL, for the chat's cookies: the review consent, and its flags (SIM_SUB_AGENTS=0). */
  agentsUrl: string
  /** Seed the case's data and settings, then bring the page to the case's route. Runs inside the run, so a failure is recorded as an invalid run. */
  setup: (models: SimulationModels) => Promise<void>
  /** What the person sees. */
  perceptionRoots: PerceptionRoot[]
  /** The locale the chat renders in: its composer strings are matched. */
  locale: ChatDriverLocale
  /** Defaults to CHAT_FRAME. */
  chatFrame?: string
  /** Defaults to ensureChatOpen on the page. */
  ensureChatOpen?: (composer: Locator) => Promise<void>
  /**
   * The conversation exports of what the person said during the run, oldest first: the agents
   * service's review export (`/api/review/<owner>/<conversation>/export`), the same file a real
   * session is debugged with. Every chat surface runs its loop on the server, so this is the only
   * record of what the model was sent and what it called. `bridgeSettings` turns the review on, and
   * the runner gives the consent it needs.
   */
  fetchExports: (since: Date) => Promise<ConversationExport[]>
}

export async function runSimulation (page: Page, simCase: SimulationCase, opts: SimulationOptions): Promise<void> {
  const assistantModel = process.env.SIM_ASSISTANT_MODEL ?? 'sonnet'
  // The sub-agent, compaction and moderation roles, pinned separately and lower: that
  // is where a deployment puts a small model, so that is where the product has to
  // work. See BACKGROUND_ROLES.
  const toolsModel = process.env.SIM_TOOLS_MODEL ?? 'haiku'
  const userModel = resolveUserModel()
  const started = Date.now()
  const consoleErrors: string[] = []
  let turns = 0
  let error: string | undefined

  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`))
  // The persona has no dialog tool: confirm what a person would (leaving a form with
  // the defaults a form library filled in), and keep a trace for the judge.
  page.on('dialog', async dialog => {
    consoleErrors.push(`dialog accepted by the runner: ${dialog.type()} « ${dialog.message()} »`)
    await dialog.accept()
  })
  const conversation: Array<{ role: string, text: string }> = []
  let perception: ReturnType<typeof createPagePerception> | undefined

  const sidecar = () => ({
    case: simCase.name,
    valid: !error,
    error,
    assistantModel,
    toolsModel,
    userModel,
    turns,
    durationMs: Date.now() - started,
    finishedAt: new Date().toISOString()
  })

  // Written up front and overwritten on the way out. A Playwright test timeout
  // aborts the body without running the catch, so without this the previous run's
  // sidecar and verdict would still be on disk and would be read as this run's result.
  writeEvidence(simCase.name, {
    case: simCase.name,
    goal: simCase.goal,
    persona: simCase.persona,
    route: simCase.route,
    conversation: [],
    consoleErrors: [],
    observations: [],
    exports: []
  }, { ...sidecar(), valid: false, error: 'run did not complete (timed out or was killed)', durationMs: 0 })

  try {
    // Setup lives inside the try too: a case that fails to dispatch (bridge down,
    // seeding rejected) must still write an invalid sidecar naming the error.
    await assertBridgeUp()

    // Consent answered up front: the run is read back through the conversation export, which only
    // covers threads the person agreed to have reviewed — and the consent sheet is not what a case
    // is about, so the persona is not asked.
    await page.context().addCookies([{ name: REVIEW_CONSENT_COOKIE, value: REVIEW_CONSENT_YES, url: new URL(opts.agentsUrl).origin }])

    // SIM_SUB_AGENTS=0 runs the chat in its experimental flattened mode: sub-agents
    // that do not pin a model hand their tools to the assistant itself. Set through
    // the chat's own flags cookie, as its settings page does, before the chat loads.
    if (process.env.SIM_SUB_AGENTS === '0') {
      await page.context().addCookies([{
        name: 'agent-chat-flags',
        value: encodeURIComponent(JSON.stringify({ toolExploration: false, subAgents: false, simpleSubAgents: true, mermaid: false, showReasoning: false })),
        url: opts.agentsUrl
      }])
    }

    await opts.setup({ assistantModel, toolsModel })

    const root = page.frameLocator(opts.chatFrame ?? CHAT_FRAME)
    // Single source of truth for the composer's locale-dependent strings: the chat
    // driver and the perception's off-limits list must agree on what "the composer" is.
    const strings = chatDriverStrings(opts.locale)
    const composer = root.getByPlaceholder(strings.input)
    const openChat = () => opts.ensureChatOpen ? opts.ensureChatOpen(composer) : ensureChatOpen(page, composer)
    await openChat()

    const chat = createChatDriver(root, { locale: opts.locale })

    // offLimits: the composer belongs to the runner, not the persona. Refusing these
    // names structurally is what stops the persona from typing its message into the
    // page and pressing Send itself. `strings.reset` is off-limits because a mid-run
    // click erases the transcript the run exists to produce. Ordinary controls stay
    // reachable — including the drawer toggle, which a real user can and does click.
    perception = createPagePerception(opts.perceptionRoots, { offLimits: [strings.input, strings.send, strings.stop, strings.reset] })

    // Set when the assistant ended a turn by declaring wait_for_user_action rather
    // than by finishing. It has handed control to the person, and the person only
    // exists inside nextUserMessage — so the next pass is where they act on it.
    let handedOver = false

    for (let i = 0; i < simCase.maxTurns; i++) {
      perception.setTurn(i + 1)
      const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i, { perception })
      if (handedOver) {
        // The pass above was the person's chance to act on the wait. If they took it,
        // the wait resolved and the assistant is finishing the turn it paused — let it,
        // rather than speaking over its reply. If they ignored it, the wait is still
        // armed and this returns 'waiting' at once.
        handedOver = (await chat.waitForTurn(TURN_CEILING_MS)) === 'waiting'
        const resumed = await chat.readConversation()
        const changed = resumed.length !== conversation.length
        conversation.length = 0
        conversation.push(...resumed)
        // Whatever the person wrote in that pass, they wrote it before the reply
        // their action caused. Drop it and let them read the reply first; what they
        // did stays where they did it (the persona stamps each action's place).
        if (changed) continue
      }
      if (isDone(message)) break
      if (message === '') {
        // Distinct from a real stop: the persona subprocess produced no text at all
        // (refusal, swallowed error, empty completion).
        error = `simulated user returned no message (empty completion) on turn ${i + 1}`
        break
      }
      // The persona may have navigated the page — or closed the drawer itself —
      // between turns, so re-open before sending.
      await openChat()
      // While the assistant works, the send control is Stop: an ordinary wait for a
      // turn, so it gets the turn ceiling rather than the driver's short one.
      await chat.sendMessage(message, { readyTimeoutMs: TURN_CEILING_MS })
      // 'ended' is the assistant finished; 'waiting' is it holding the turn open for
      // the person, which is a turn boundary as far as they are concerned.
      handedOver = (await chat.waitForTurn(TURN_CEILING_MS)) === 'waiting'
      // Read first, then replace: a throw from readConversation must not leave the
      // transcript empty.
      const read = await chat.readConversation()
      conversation.length = 0
      conversation.push(...read)
      // Counted only once the turn is reflected in the transcript.
      turns++
    }

    // A judge cannot judge an empty transcript, and a persona that says DONE on its
    // first message produces one while looking like a clean run.
    if (turns === 0 && !error) error = 'no turns completed — the simulated user stopped before saying anything'
    if (conversation.length === 0 && !error) error = 'transcript is empty — messages were sent but readConversation matched nothing, so the chat markup has probably moved'
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  // Outside the try, and overriding whatever else was recorded: these are never the
  // product's fault, and every other symptom is downstream of them, so they name the
  // cause. A cold Vite dev server fails page chunks while it re-optimizes its
  // dependencies: the run then measures the dev server.
  const devServerError = consoleErrors.find(e => e.includes('Outdated Optimize Dep') || e.includes('Failed to fetch dynamically imported module'))
  if (devServerError) error = `dev server failure, warm it up and re-run (run is not judgeable): ${devServerError}`

  // Read after the conversation, and outside the try so an invalid run still carries whatever the
  // assistant managed to do — usually the most informative part of a failure. Never allowed to turn
  // a good run into a failed one: this is evidence gathering, not a check.
  let exports: ConversationExport[] = []
  const evidenceErrors: string[] = []
  try {
    exports = await opts.fetchExports(new Date(started))
  } catch (err) {
    evidenceErrors.push(`could not export the run's conversations: ${err instanceof Error ? err.message : String(err)}`)
  }
  // Every turn leaves a record: a run with no export reached nothing the judge can read.
  if (!error && !evidenceErrors.length && exports.length === 0) error = 'no conversation was exported — the chat never reached the agents service, or the review is off'
  // A provider failure does not throw either: the turn "completes" and the run's own record says it
  // ended in error. It overrides, because every other symptom is downstream of it.
  try {
    const failures = runErrors(exports.map(parseConversationExport))
    if (failures.length) error = `provider or run error (run is not judgeable): ${failures[0]}`
  } catch (err) {
    evidenceErrors.push(`could not read the exported runs: ${err instanceof Error ? err.message : String(err)}`)
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
  // `valid` is derived, never hardcoded, so that reportCases says "invalid (…)"
  // instead of re-reporting the previous run's verdict.
  writeEvidence(simCase.name, transcript, sidecar())

  // An invalid run must never be judged, so surface it as a test failure.
  if (error) throw new Error(`run invalid: ${error}`)
}
