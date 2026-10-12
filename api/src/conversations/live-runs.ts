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
import type { MessagePart } from './operations.ts'

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
