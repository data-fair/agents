/**
 * Runs one turn of an autonomous agent, in this process, asynchronously.
 *
 * A turn that has BEGUN is deliberately not resumable: recovery marks it `interrupted`
 * (recoverOwnerlessRuns) rather than continuing it, because its tool calls may already have fired and
 * re-running them would execute those side effects twice. A run that never began — no assistant message
 * yet, so nothing can have happened — is resumed instead. That one rule replaced two mechanisms which
 * took opposite actions on the identical population. The spec chose this over distributed run leasing
 * until concurrency demands otherwise.
 *
 * Two invariants hold for every path through this module:
 *  - a run always reaches a terminal status, and
 *  - a run always leaves exactly one assistant message.
 * "Failure is a message, not a silence": a conversation that simply stops, or a turn that
 * appears to think forever, is the failure mode the spec forbids.
 */

import mongo from '#mongo'
import config from '#config'
import locks from '@data-fair/lib-node/locks.js'
import Debug from 'debug'
import type { ConversationRun } from '#types'
import { runStopReasonMessage, publicErrorDetail, type ToolSet, turnDeadlineSeconds, usageIdentityFor, speakerIdentityFor, withAppendedText, type RunStopReason, type ConversationTurnRun } from './operations.ts'
import { checkQuotas, moderateTurn } from './turn-gates.ts'
import { moderationApplies } from '../moderation/operations.ts'
import { conversationTarget, closeConversationRunBare, type TurnTarget, type TurnResult, type TurnFailure } from './turn-target.ts'
import { appendMessage, finishRun, bufferRunWrites, resolveAgent, rejectPendingApprovals } from './service.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { contextBudget } from '../models/operations.ts'
import { openAutonomousAgentTools } from '../mcp-servers/client.ts'
import { openExternalMcpTools } from '../mcp-servers/external.ts'
import { envPublicIps } from '../web/public-lookup.ts'
import { personSiteCredentials, type SiteCredentials } from '../mcp-servers/operations.ts'
import { applyApprovalPolicy, personalAssistantTools, unattended } from './approval-policy.ts'
import { agentSiteCredentials } from '../nhi/service.ts'
import { notifyMessage } from '../agent-session/registry.ts'
import { isPersonalAgentId } from '../agent-session/personal-agent.ts'
import { settlePendingWait } from './waits.ts'
import { TurnStopped, stopCauseOf, interruptedWaitResult, interruptReason, type StopCause } from './interrupted-turn.ts'
import { turnFilesFor } from '../files/service.ts'
import { createLinkOpener } from '../files/download.ts'
import { buildServiceTools } from './service-tools.ts'
import { REPORT_OUTCOME_TOOL_NAME, OUTCOME_REMINDER, reportedOutcome } from './service-tool-names.ts'
import { agentGuide, readAgentSkill, AGENT_SKILLS_SERVER } from '../self-knowledge/operations.ts'
import { runModelLoop } from './model-loop.ts'
import { liveRuns, watchStopRequests, type LiveRun } from './live-runs.ts'
import { acceptingTurns } from './shutdown.ts'

const debug = Debug('df-agents:autonomous-agent-executor')

const LOCK_ORIGIN = 'autonomous-agent-executor'

/** One conversation is one serialised timeline, so the lock is keyed on it. */
const conversationLockId = (conversationId: string) => `conversation:${conversationId}`

/**
 * The oldest run of this conversation that still needs doing.
 *
 * This is what stops a message from being dropped: a post that arrives while another turn
 * holds the lock leaves its run `running`, and the holder comes back for it here.
 */
const nextPendingRun = async (conversationId: string) => {
  return await mongo.runs.findOne(
    { conversationId, status: 'running' },
    { projection: { _id: 0 }, sort: { startedAt: 1 } }
  ) as ConversationTurnRun | null
}

/**
 * Perform the turn itself: resolve the model, gather the agent's tools, and run the loop.
 *
 * An autonomous agent with no verified NHI cannot run at all — its whole tool surface is
 * reached as that identity — so this refuses early with an actionable message rather than
 * producing a toolless turn that looks like a capability problem.
 */
const performTurn = async (run: ConversationRun, abortSignal: AbortSignal, target: TurnTarget): Promise<TurnResult> => {
  // A run stopped before it began does nothing: no quota read, and above all no moderation, which
  // classifies the conversation's LATEST message — the newer one that stopped this run, which its own
  // run will classify again (a second moderator call, a second strike). Settled as any other abort.
  abortSignal.throwIfAborted()
  const autonomousAgent = await resolveAgent(run.owner, run.agentId)
  if (!autonomousAgent) throw new Error('the autonomous agent no longer exists')

  // The session watching this conversation as the turn started (looked up by its target), if any.
  // UNDEFINED IS NORMAL: a turn can run with nobody there — a tab closed mid-turn, and later a scheduled
  // run that never had one. Such a turn has no page tools and streams to nobody; the stored message is
  // still the record.
  //
  // This lookup is the whole of what colocation buys. The loop runs in the process holding the socket,
  // so "who is watching, and what can their page do?" is a Map read.
  const session = target.session
  // The kill switch. Disabling an autonomous agent must actually stop it answering, calling
  // tools as its identity, and spending credits.
  if (autonomousAgent.enabled === false) {
    return {
      parts: [{ type: 'text', text: 'This autonomous agent is currently disabled, so it cannot act. An administrator can re-enable it.' }],
      steps: 0,
      credits: 0,
      stopReason: 'error',
      refused: true
    }
  }
  // A CONFIGURED agent with no enrolment cannot run: its whole tool surface is reached as that
  // identity, so a toolless turn would look like a capability problem rather than a setup one.
  //
  // The PERSONAL assistant is the deliberate exception — it has no non-human identity BY DESIGN and acts as
  // the person whose socket it is. This guard predates them and would have refused every such turn
  // with a message about enrolment, which is how the first end-to-end test failed.
  if (!isPersonalAgentId(autonomousAgent.id) && !autonomousAgent.nhi?.clientId) {
    return {
      parts: [{ type: 'text', text: 'This autonomous agent has no non-human identity enrolled, so it cannot reach any of its tools. An administrator needs to complete its enrolment before it can run.' }],
      steps: 0,
      credits: 0,
      stopReason: 'error',
      refused: true
    }
  }

  const settings = await getSettings(run.owner)

  // The turn's files: a configured agent's, when the deployment has a file store. Undefined is "files off",
  // and it is exactly what the personal assistant gets: nothing file-related is offered (spec §2).
  const files = isPersonalAgentId(autonomousAgent.id) ? undefined : turnFilesFor(run)

  // BEFORE ANY MODEL CALL: a refused turn must cost nothing.
  //
  // Read as a list, which is what extracting them bought. The identity is per agent — a configured
  // agent bills as itself, the personal assistant as the person using it (see usageIdentityFor).
  const identity = usageIdentityFor(autonomousAgent, run)
  // Moderation judges the person who wrote, whoever the turn bills (see speakerIdentityFor).
  const speaker = speakerIdentityFor(autonomousAgent, run, identity)
  for (const gate of [
    () => checkQuotas(run, settings, identity, autonomousAgent.id),
    // Moderation is a CHAT rule: it judges what a person wrote. A planned task's prompt is admin-authored
    // and its turn runs as the agent's own identity, so there is nothing of a person's to classify.
    // Within a chat, a wake or an approval continuation has no message of the person's either — they
    // acted on the page, or decided on a call — and moderating it would re-judge the message that started
    // the turn: a moderator call for nothing, and possibly a second strike for the same message.
    () => target.surface === 'chat' && run.trigger !== 'wake' && run.trigger !== 'approval' && moderationApplies(settings, speaker.role)
      ? moderateTurn(run, settings, identity, speaker, () => liveRuns.get(run.id)?.controller.abort(new TurnStopped('late-block')))
      : undefined
  ]) {
    const refusal = await gate()
    if (refusal) return { ...refusal, refused: true }
  }

  const { model, entry } = resolveRoleModel(settings, 'assistant')
  // resolveRoleModel already resolved the catalog entry; no need to resolve it twice.
  const budget = contextBudget(entry, config.compactionPercent)

  // Connections stay OPEN for the whole turn: a tool's execute closes over its client, and
  // the MCP SDK's close() clears the transport, so closing early makes every call reject
  // with 'Not connected'. Released in the finally below.
  // WHO IT ACTS AS, AND WHERE — the one port. A configured agent acts as itself on its organization's
  // sites and anonymously elsewhere; the personal assistant acts as the person, on the site of their
  // socket only (see docs/architecture/overview.md, Hosts).
  const socketSite = session?.siteUrl()
  const sites: SiteCredentials = autonomousAgent.nhi
    ? await agentSiteCredentials(autonomousAgent, target.conversationSiteUrl ?? socketSite, session?.clientIp())
    : personSiteCredentials(socketSite, session?.sessionCookie(), session?.clientIp())
  const homeHost = sites.homeSite ? new URL(sites.homeSite).host : undefined
  const anonymousOn = sites.home === 'anonymous' ? homeHost : undefined
  const unconfirmedOn = sites.home === 'unconfirmed' ? homeHost : undefined
  // The personal assistant takes the WHOLE catalog, so an unreachable entry is an availability event rather
  // than a misconfiguration: it is skipped and reported instead of failing the turn. A configured
  // agent's selection is deliberate, so for it a failure still throws.
  const { tools: listedTools, skippedServers, filteredOut, needsFiles, guides: catalogGuides, readSkill: readCatalogSkill, close: closeTools } =
    await openAutonomousAgentTools(autonomousAgent, sites, {
      onServerError: isPersonalAgentId(autonomousAgent.id) ? 'skip' : 'throw',
      files: !!files
    })
  // Everything from here on releases the connections however it ends: an open that succeeded and a later
  // step that throws (the service tools, say) must not leave clients and sockets behind.
  let external: Awaited<ReturnType<typeof openExternalMcpTools>> | undefined
  try {
  // External MCP servers: anonymous, egress-guarded, never the personal assistant's (see ./mcp-servers/external.ts).
    if (!isPersonalAgentId(autonomousAgent.id) && autonomousAgent.externalMcpServers?.length) {
      external = await openExternalMcpTools(autonomousAgent.externalMcpServers, { publicIps: envPublicIps() })
    }
    const catalog: ToolSet = { ...listedTools, ...external?.tools }
    if (external) skippedServers.push(...external.skippedServers)
    // What the turn's servers say about their tools (instructions, skills), catalog first then external, in
    // the agent's order; and one reader routing a skill read to whichever side holds that server.
    // A configured agent's own skills come first (api/src/self-knowledge/operations.ts, agentGuide): the
    // personal assistant has no history tools, so no earlier-work skill either.
    const ownGuide = isPersonalAgentId(autonomousAgent.id) ? [] : [agentGuide()]
    const guides = [...ownGuide, ...catalogGuides, ...(external?.guides ?? [])]
    const readSkill = async (server: string, uri: string): Promise<string> => {
      if (ownGuide.length && server === AGENT_SKILLS_SERVER) return readAgentSkill(uri)
      if (catalogGuides.some(g => g.server === server)) return await readCatalogSkill(server, uri)
      if (external) return await external.readSkill(server, uri)
      throw new Error(`"${server}" is not one of your tool servers this turn`)
    }
    if (skippedServers.length) {
      debug('skipped %d unreachable server(s): %o', skippedServers.length, skippedServers)
    }
    // THE APPROVAL GATE, on catalog tools: a configured agent's policy, or the personal assistant's fixed
    // one (every change waits for the person). Page tools act in the person's own browser, and service
    // tools are the loop's own.
    const catalogTools = isPersonalAgentId(autonomousAgent.id)
      ? personalAssistantTools(catalog, { anonymous: run.triggeredByRole === 'anonymous' })
      : applyApprovalPolicy(catalog, autonomousAgent.approvalLevel)

    // The service's own tools, from the registry (./service-tools.ts): spread LAST, so a catalog tool that
    // happens to share a name cannot stand in for one, and recorded like a catalog call's source.
    const service = await buildServiceTools({
      agent: autonomousAgent,
      run,
      surface: target.surface,
      session,
      ...(files ? { files } : {}),
      ...(target.reportOutcome ? { reportOutcome: target.reportOutcome } : {}),
      catalog: { tools: catalog, filteredOut, skippedServers, needsFiles },
      guides: { list: guides, read: readSkill }
    })
    // An UNATTENDED turn (a planned task's run) is offered no tool needing approval, from any source.
    const assembled: ToolSet = { ...catalogTools, ...service.tools }
    const tools = target.surface === 'task' ? unattended(assembled) : assembled

    const callPath = files
      ? {
          files,
          // fetch_url's allowlist for anonymous links: the agent's, as the turn started.
          openLink: createLinkOpener({ sites, allowedUrls: autonomousAgent.web?.enabled ? autonomousAgent.web.allowedUrls ?? [] : [], publicIps: envPublicIps() })
        }
      : {}
    // Which of the fixed tools are MCP servers', for the run's record (shared/tool-source.ts); the rest are the
    // service's own. A service tool sharing a name wins the set above, so it is not counted as the server's.
    const toolOrigins: Record<string, 'catalog' | 'external'> = {}
    for (const name of Object.keys(tools)) {
      if (name in service.tools) continue
      if (external && name in external.tools) toolOrigins[name] = 'external'
      else if (name in listedTools) toolOrigins[name] = 'catalog'
    }
    const loop = { run, abortSignal, model, entry, tools, toolOrigins, settings, budget, autonomousAgent, target, memory: service.memory, anonymousOn, unconfirmedOn, callPath, guides, guidesRead: readSkill }
    const result = await runModelLoop(loop)
    // A PLANNED TASK'S RUN THAT DID NOT REPORT is reminded, once: a second pass of the same turn, offered only
    // report_outcome, whose record continues the first's. Only after a turn that finished — a turn cut short
    // explains itself, and its failure is the outcome. A run still silent after it keeps no outcome.
    if (target.surface === 'task' && result.stopReason === 'completed' && tools[REPORT_OUTCOME_TOOL_NAME] && !reportedOutcome(result.parts)) {
      debug('task run %s ended without report_outcome: reminding it once', run.id)
      return await runModelLoop({
        ...loop,
        tools: { [REPORT_OUTCOME_TOOL_NAME]: tools[REPORT_OUTCOME_TOOL_NAME] },
        continuation: { parts: result.parts, note: OUTCOME_REMINDER, credits: result.credits, steps: result.steps }
      })
    }
    return result
  } finally {
    // The turn is over (normally, by throw, or by abandonment): release the MCP connections.
    await closeTools()
    await external?.close()
  }
}

/**
 * Run one turn to a terminal state, whatever it is a turn OF.
 *
 * What every kind of run needs lives here: the abort controller the abort routes reach, the buffered
 * telemetry, the deadline, the turn itself, and the classification of a throw — abort, timeout, a late
 * moderation block or a genuine error. What the turn's record IS lives behind the target (see
 * ./turn-target.ts): writing it, closing the run, telling a watcher.
 *
 * `open` runs inside the try, because opening the record can fail (appending a conversation's message);
 * `closeBare` closes the run from the classified failure when no target was ever opened.
 */
export const driveTurn = async (
  run: ConversationRun,
  open: () => Promise<TurnTarget>,
  closeBare: (failure: TurnFailure) => Promise<unknown>
): Promise<void> => {
  const abortController = new AbortController()
  const live: LiveRun = { controller: abortController, agentId: run.agentId, conversationId: run.conversationId }
  liveRuns.set(run.id, live)
  // A stop received by another API process reaches this turn through its run document.
  const { initial: initialStopRead, stop: stopWatching } = watchStopRequests(run.id, abortController)
  // The run's telemetry and spend are held from here until finishRun writes them (see bufferRunWrites).
  bufferRunWrites(run.id)

  // The ceiling is the run's: turnTimeoutSeconds for a chat, taskTimeoutSeconds for a planned task's run
  // (turnDeadlineSeconds). It has to be enforced twice over, because abort() is only a REQUEST.
  // abortController.signal asks the provider and the MCP client to stop, which is what a
  // well-behaved fetch-based client does; but a client that ignores the signal would hold
  // the conversation's lock until the lock's own TTL expired. So the turn is also raced
  // against the deadline and abandoned if it overruns. Abandoning is safe: performTurn only
  // returns a value, it never writes — all persistence happens in the target's close and fail.
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadlineSeconds = turnDeadlineSeconds(run, config)
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      abortController.abort(new TurnStopped('timeout'))
      reject(new Error(`run exceeded its ${deadlineSeconds}s ceiling`))
    }, deadlineSeconds * 1000)
  })

  let target: TurnTarget | undefined

  try {
    // Inside the try: opening can fail (the conversation vanished, a duplicate seq, a transient mongo
    // error) and that must still close the run out rather than escape and leave it `running` forever.
    //
    // The stop read comes first: a run stopped while queued — typically by the next message, which
    // stops a run it finds between createRun and here — is then already aborted when performTurn checks.
    // It still opens its record, so it leaves its one settled message, but runs no gate and no model.
    await initialStopRead
    target = await open()
    live.messageSeq = target.messageSeq
    const result = await Promise.race([performTurn(run, abortController.signal, target), deadline])
    await target.close(result)
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    // An abort is not a failure of the turn: distinguish the clock from a caller pressing
    // stop, and from a genuine error, because a reader reacts differently to each.
    const stopCause: StopCause | undefined = abortController.signal.aborted ? stopCauseOf(abortController.signal.reason) : undefined
    // A late block is refused, not failed: declining WAS the answer, as for an on-time block (see turn-gates).
    const stopReason: RunStopReason = stopCause === 'late-block' ? 'completed' : stopCause === 'timeout' ? 'timeout' : stopCause ? 'aborted' : 'error'
    const status = stopCause === 'late-block' ? 'done' : stopCause && stopCause !== 'timeout' ? 'aborted' : 'error'
    // The run keeps the whole error for administrators; the person, the transcript and the model are told
    // only what publicErrorDetail lets through. An abort's reason is this service's own words.
    const detail = stopCause ? raw : publicErrorDetail(err)
    const failure: TurnFailure = {
      stopReason,
      status,
      ...(stopCause === 'late-block' ? {} : { error: raw }),
      detail,
      ...(stopCause ? { stopCause } : {}),
      interrupt: stopCause ? interruptReason(stopCause) : 'ended',
      cause: err
    }
    // No target if opening itself failed; the run then carries the failure alone.
    if (target) await target.fail(failure)
    else await closeBare(failure)
  } finally {
    if (timeout) clearTimeout(timeout)
    stopWatching()
    liveRuns.delete(run.id)
  }
}

/**
 * Run one turn of a conversation to a terminal state.
 *
 * The assistant message is created BEFORE the turn runs, `pending: true`, for two reasons:
 * a reader sees the turn exists while it is being produced, and a throw still has a message
 * to write the failure into rather than needing to invent one afterwards.
 */
export const runTurn = async (run: ConversationTurnRun): Promise<void> => {
  const conversation = await mongo.conversations.findOne(
    { id: run.conversationId },
    { projection: { _id: 0 } }
  )
  if (!conversation) {
    // The conversation was deleted under us; there is nowhere to put a message, so the run
    // is all that can be closed out.
    await finishRun(run, { status: 'error', stopReason: 'error', error: 'conversation no longer exists' })
    return
  }

  await driveTurn(run, async () => {
    // A turn answering the person's MESSAGE rejects whatever approval is still pending, again. Posting
    // already did, but the turn that asked may then still have been finishing — its own last writes put
    // `approval-requested` back, and the card reappeared in a message that is no longer the last. Here,
    // under the conversation's lock, that turn has closed its message. Idempotent: usually there is
    // nothing left to reject.
    if (run.trigger === 'user') await rejectPendingApprovals(run.conversationId)

    // And a wait handed over by a turn that was still finishing when the message was posted: the post found
    // no `pendingWait` to settle, then that turn's close wrote one. The person answered it by writing.
    if (run.trigger === 'user') await settlePendingWait(run.conversationId, wait => interruptedWaitResult(wait.expecting))

    // Can fail (the conversation vanished between the findOne above and the $inc, a duplicate seq, a
    // transient mongo error): the driver then closes the run bare.
    const message = await appendMessage(conversation, {
      role: 'assistant',
      parts: [],
      runId: run.id,
      pending: true
    })

    // Announced at once, empty and pending, so the turn's first streamed words land in ITS bubble. The
    // client adds a delta to the last assistant bubble it has; a turn that follows another assistant
    // message with no message of the person's between — a wake, after a handover — had its reply
    // glued onto the handover's bubble, then shown again once its own frame arrived.
    notifyMessage(run.conversationId, { seq: message.seq }, true)

    // The assistant message's own seq bounds the history: it was created before the turn
    // (empty, pending), so it must not be fed back to the model as an empty turn.
    return conversationTarget(run, message, conversation)
  }, failure => closeConversationRunBare(run, failure))
}

/**
 * Kick a turn. Callers do NOT await this — the message route returns as soon as the user
 * message is persisted, and the run document is how a caller follows along.
 *
 * When the lock is already held, this returns immediately and leaves the run `running`:
 * the holder picks it up through nextPendingRun. Nobody is rejected and no message is
 * dropped. The outer loop exists because a post can land between the holder's last
 * nextPendingRun check and its release, which would otherwise orphan that run forever.
 */
export const startRun = async (run: ConversationTurnRun): Promise<void> => {
  const lockId = conversationLockId(run.conversationId)
  while (true) {
    if (!await locks.acquire(lockId, LOCK_ORIGIN)) return
    try {
      let current: ConversationTurnRun | null = await nextPendingRun(run.conversationId)
      // Once shutdown has begun, a queued run is not begun here: it has no assistant message yet, so
      // recovery resumes it on another instance once this one releases the lock (live-runs.ts, SHUTDOWN).
      while (current && acceptingTurns()) {
        await runTurn(current)
        current = await nextPendingRun(run.conversationId)
      }
    } finally {
      // In a finally so a throw cannot wedge the conversation permanently.
      await locks.release(lockId)
    }
    if (!acceptingTurns() || !await nextPendingRun(run.conversationId)) return
  }
}

/**
 * Recover runs that are `running` with nobody running them.
 *
 * ONE function with ONE rule, because there are two correct answers and which applies depends on
 * whether the turn had already begun:
 *
 *  - it HAS an assistant message  -> it started, so its tool calls may already have fired. Mark it
 *    `interrupted`. Re-running it would execute those side effects a second time (at-least-once on a
 *    catalog that may contain writes) and append a second assistant message for one run.
 *  - it has NO assistant message  -> it died between createRun and appendMessage, so nothing can have
 *    happened yet. Resume it: interrupting would throw away a turn the instructor is waiting for.
 *
 * `runTurn` appends that message before `performTurn` opens the agent's tools, which is what makes the
 * test exact rather than a guess.
 *
 * This replaced two mechanisms that took OPPOSITE actions on the identical population — a boot sweep
 * marking them `interrupted` and a 30s reaper resuming them — where only ordering (the sweep runs
 * first) kept a single-instance deployment from noticing.
 *
 * A held conversation lock means another instance is executing that conversation right now, so those
 * are skipped entirely. Because a lock's TTL is refreshed only by its holder, a dead process's lock
 * expires and its runs are recovered on a later pass.
 */
export const recoverOwnerlessRuns = async (scope: Record<string, unknown> = {}): Promise<{ interrupted: number, resumed: number, skipped: number }> => {
  const candidates = await mongo.runs
    .find({ status: 'running', kind: 'conversation', ...scope }, { projection: { _id: 0 } })
    .toArray() as ConversationTurnRun[]

  const heldLocks = new Set(
    (await mongo.db.collection<{ _id: string }>('locks')
      .find({ _id: { $regex: `^${conversationLockId('')}` } }, { projection: { _id: 1 } }).toArray())
      .map(doc => String(doc._id).slice(conversationLockId('').length))
  )
  const ownerless = candidates.filter(run => !heldLocks.has(run.conversationId!) && !liveRuns.has(run.id))
  const skipped = candidates.length - ownerless.length

  let interrupted = 0
  let resumed = 0
  for (const run of ownerless) {
    // Within the run's conversation, so the lookup rides the {conversationId, seq} index rather than
    // scanning every message for a runId nothing indexes.
    const existing = await mongo.messages.findOne(
      { conversationId: run.conversationId, runId: run.id, role: 'assistant' },
      { projection: { _id: 0 } }
    )
    if (!existing) {
      resumed++
      // Not awaited as a group: each acquires the conversation lock itself and drains from there.
      startRun(run).catch(err => console.error('autonomous agent run failed to resume', err))
      continue
    }
    // Only while the message is still PENDING. A turn can finish between the candidate read and the
    // lock read above: its message is then closed, its run closed, its lock released and it has left
    // `liveRuns`, so it passes both filters. That order (message closed BEFORE the run, run closed
    // before the lock is released) makes `pending` exact: a run that had a holder and is now neither
    // locked nor live already has a closed message, which must not gain a restart notice. finishRun
    // writes it only while pending, so two instances recovering the same dead run append it once.
    // stopReason has no 'interrupted' member — the status carries that — so the reason is 'error' with
    // the restart named as the detail. An approval run's approved calls are settled by finishRun as of
    // unknown outcome: the process may have died after a tool did its work.
    const notice = runStopReasonMessage('error', 'interrupted by a restart')
    const { closed } = await finishRun(
      run,
      { status: 'interrupted', stopReason: 'error', error: 'interrupted by a restart' },
      existing.pending ? { message: { seq: existing.seq, patch: { parts: withAppendedText(existing.parts, notice), pending: false } } } : {}
    )
    if (closed) interrupted++
  }

  if (interrupted) console.log(`[autonomous-agents] interrupted ${interrupted} started run(s) left behind by a dead process`)
  if (resumed) console.log(`[autonomous-agents] resumed ${resumed} run(s) that had not started yet`)
  if (skipped) console.log(`[autonomous-agents] left ${skipped} running run(s) alone: another instance holds their conversation`)
  return { interrupted, resumed, skipped }
}
