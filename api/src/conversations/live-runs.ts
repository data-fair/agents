/**
 * The turns this process is executing, by run id: what the abort routes stop, and what a page attaching
 * mid-turn is shown.
 *
 * In-process, like the executor and the sessions: a run is not resumable and does not migrate, so only the
 * process that holds the turn can abort its controller. A stop received by ANOTHER process reaches it
 * through the run document instead — `abortRequestedAt`, which every live turn polls for (see
 * watchStopRequests in executor.ts). The agent id travels with the controller so a whole agent can be
 * stopped at once (abortRunsOfAgent).
 *
 * The growing answer is NOT written back as it streams: a watching browser receives every token, and the
 * store gets the answer at the end. `parts` is what replaces the write for the watcher's side — a page
 * reloaded, or a second tab opened, mid-turn gets the answer so far on attach and the rest live — and what
 * a turn stopped or failing is settled from. What is given up: a restart mid-answer loses the text of the
 * step in progress. Tool calls and their results are still written as they happen (the target's
 * `persist`), and those are the work worth keeping.
 */
import mongo from '#mongo'
import Debug from 'debug'
import type { MessagePart } from './operations.ts'
import { TurnStopped } from './interrupted-turn.ts'

const debug = Debug('df-agents:autonomous-agent-executor')

export interface LiveRun {
  controller: AbortController
  agentId: string
  conversationId?: string
  /** The conversation message this turn writes, once its target is open. */
  messageSeq?: number
  /** The turn's parts as the model loop produces them, once it has started. */
  parts?: () => MessagePart[]
}

export const liveRuns = new Map<string, LiveRun>()

/** The parts a live run has produced so far, if it got as far as producing any. */
export const livePartsOf = (runId: string): MessagePart[] | undefined => {
  const parts = liveRuns.get(runId)?.parts
  return parts && structuredClone(parts())
}

/** The answer a live turn of this conversation has produced so far, if one is running here. */
export const liveTurnOf = (conversationId: string) => {
  for (const live of liveRuns.values()) {
    if (live.conversationId === conversationId && live.parts && live.messageSeq !== undefined) {
      return { messageSeq: live.messageSeq, parts: structuredClone(live.parts()) }
    }
  }
}

/** Whether this process is executing the run right now. */
export const isRunLive = (runId: string) => liveRuns.has(runId)

/** How often a live turn reads its own run for a stop requested through another process. */
export const STOP_POLL_MS = 2000

/**
 * Stop one run, wherever it is held. True when this process aborted it OR a stop was recorded on it.
 *
 * Aborted here when this process holds the turn; recorded on the run while it is still `running`, so
 * the process that does hold it stops it at its next poll (watchStopRequests). A Stop, like a person's:
 * the settled calls say the reply was stopped. False for a run that has already ended.
 */
export const abortRun = async (runId: string): Promise<boolean> => {
  const live = liveRuns.get(runId)
  live?.controller.abort(new TurnStopped('stop'))
  const requested = await mongo.runs.updateOne(
    { id: runId, status: 'running' },
    { $set: { abortRequestedAt: new Date().toISOString(), abortReason: 'stop' } }
  )
  return !!live || requested.modifiedCount > 0
}

/**
 * Stop the turns of one conversation, so a new prompt can take the turn back.
 *
 * A person who writes while the assistant is still working means to redirect it: their message is
 * what the next turn answers, and letting the current one run on would answer the question before.
 * (A pending wait is not a live turn — the message answers it directly, see ./waits.ts.)
 *
 * Aborted here when this process holds the turn, and recorded on the conversation's `running` runs,
 * so a run that exists but is not live yet — created, still waiting for the conversation's lock — or
 * one held by another process stops as soon as it reads its run (watchStopRequests), with the same
 * reason. Called BEFORE the next turn's run is created, so that run is never caught. Resolves once the
 * stop is recorded.
 *
 * A Stop records it on every running run. A message records it only on earlier PROMPTS' runs (trigger
 * `user`): a queued approval continuation carries the person's decision and its replay already ends on
 * the new message, so the approved call is settled as not run rather than as of unknown outcome. A
 * live run of any trigger is still aborted here.
 */
export const abortRunsOfConversation = async (conversationId: string, why: 'person-spoke' | 'stop' = 'person-spoke'): Promise<void> => {
  for (const live of liveRuns.values()) {
    if (live.conversationId === conversationId) live.controller.abort(new TurnStopped(why))
  }
  await mongo.runs.updateMany(
    { conversationId, status: 'running', ...(why === 'person-spoke' ? { trigger: 'user' } : {}) },
    { $set: { abortRequestedAt: new Date().toISOString(), abortReason: why } }
  )
}

/**
 * Stop every live turn of one autonomous agent. Returns how many this process actually stopped.
 *
 * The kill switch is not only checked at the START of a turn: disabling an agent — or deleting it —
 * must stop whatever it is already doing, tool calls included. An admin disabling a misbehaving agent
 * means now, not eventually.
 *
 * Every `running` run of the agent is also marked, so a turn held by another API process stops at its
 * next poll (watchStopRequests) with the same reason. abort() remains a request the provider may
 * ignore — the run's own deadline is the hard backstop.
 */
export const abortRunsOfAgent = async (agentId: string): Promise<number> => {
  let stopped = 0
  for (const live of liveRuns.values()) {
    if (live.agentId !== agentId) continue
    live.controller.abort(new TurnStopped('agent-stopped'))
    stopped++
  }
  await mongo.runs.updateMany(
    { agentId, status: 'running' },
    { $set: { abortRequestedAt: new Date().toISOString(), abortReason: 'agent-stopped' } }
  )
  return stopped
}

/**
 * Abort this turn's controller when a stop is recorded on its run by another process (abortRun,
 * abortRunsOfAgent), or when its run document is gone — its agent or conversation was deleted. One read
 * of one run every STOP_POLL_MS for as long as the turn lives; the returned function stops watching.
 */
export const watchStopRequests = (runId: string, controller: AbortController): { initial: Promise<void>, stop: () => void } => {
  let reading = false
  const check = async () => {
    if (reading || controller.signal.aborted) return
    reading = true
    try {
      const stored = await mongo.runs.findOne({ id: runId }, { projection: { _id: 0, abortRequestedAt: 1, abortReason: 1 } })
      if (controller.signal.aborted) return
      // The cause the local paths give, so the turn is settled the same wherever it was stopped. A stop
      // recorded without one is a Stop.
      if (!stored) controller.abort(new TurnStopped('run-deleted'))
      else if (stored.abortRequestedAt) controller.abort(new TurnStopped(stored.abortReason ?? 'stop'))
    } catch (err) {
      debug('could not read the stop requests of run %s: %o', runId, err)
    } finally {
      reading = false
    }
  }
  // Once at once, then on the clock: a stop recorded while the run was still queued (it waited for its
  // conversation's lock, or for recovery) must not let the turn start and fire tools until the first tick.
  // That first read is returned so driveTurn can await it before the turn's gates (see performTurn).
  const initial = check()
  const timer = setInterval(check, STOP_POLL_MS)
  timer.unref()
  return { initial, stop: () => clearInterval(timer) }
}
