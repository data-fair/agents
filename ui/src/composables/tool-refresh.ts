/**
 * Policy for refreshing the tool set **in the middle of a turn**.
 *
 * The tool map handed to `streamText` is frozen when the request is built, but the host
 * page can register or drop tools while the turn is still running — the classic case is
 * the agent calling the host's `navigate` tool: the new page mounts its own components,
 * which register their own tools through WebMCP. Without a refresh those tools only
 * become callable on the *next* user turn (measured in production: the same turn keeps
 * sending toolCount=17 after a navigation, the next turn sends 21), and the agent
 * concludes it is stuck.
 *
 * The fix is to stop the stream at the next step boundary and relaunch it on the
 * accumulated history with the re-partitioned tool set. This module holds the pure
 * decisions of that mechanism (signature, restart policy, step budget) so they can be
 * unit-tested without Vue, the AI SDK or a browser — same split as sub-agent-flatten.ts.
 */

/** Max steps a whole turn may consume, across the initial stream and every restart. */
export const TURN_STEP_BUDGET = 10

/**
 * Max times one turn may restart its stream because the tool set changed. Bounded so a
 * tool set that flickers (a frame that mounts/unmounts repeatedly) cannot spin the turn:
 * after this many restarts the turn runs to completion with whatever set it has.
 */
export const MAX_TOOL_REFRESHES = 2

/**
 * Stable identity of a tool set: sorted names, joined. Only *names* matter — a tool whose
 * name is unchanged is assumed to be the same tool, and comparing execute closures would
 * fire on every aggregator re-merge (the aggregator rebuilds wrappers on each re-merge,
 * so object identity always differs even when nothing changed).
 */
export function toolsSignature (tools: Record<string, unknown>): string {
  return Object.keys(tools).sort().join(',')
}

/** Number of tools in a signature produced by {@link toolsSignature}. */
export function signatureSize (signature: string): number {
  return signature === '' ? 0 : signature.split(',').length
}

/**
 * Steps left for the rest of the turn. The budget is global to the turn, so a restart
 * must resume with what is left rather than restarting `stepCountIs` from zero.
 * Clamped to at least 1: a restart with a 0 budget would produce a stream that stops
 * before doing anything (`shouldRestartForTools` already refuses that case).
 */
export function remainingStepBudget (stepsUsed: number, stepBudget: number = TURN_STEP_BUDGET): number {
  return Math.max(1, stepBudget - stepsUsed)
}

export interface RestartDecision {
  /** The tool set changed since the running stream was built. */
  toolsChanged: boolean
  /** Finish reason of the stream that just ended. */
  finishReason: string | undefined
  /** Restarts already performed in this turn. */
  restartsDone: number
  /** Steps already consumed by this turn (initial stream + restarts). */
  stepsUsed: number
  maxRestarts?: number
  stepBudget?: number
}

/**
 * Whether the turn should relaunch `streamText` with the refreshed tool set.
 *
 * Requires *all* of:
 * - the tool set actually changed while the stream was running;
 * - the stream ended on `tool-calls`, i.e. the model was still working when the loop was
 *   cut short (this is what our `stopWhen` condition produces). A stream that ended on
 *   `stop` delivered a finished answer: relaunching it would make the assistant carry on
 *   talking with no new user input;
 * - the restart budget is not exhausted (flicker guard);
 * - the turn's step budget is not exhausted (a restart must have at least one step to run,
 *   and a turn must stay globally bounded).
 */
export function shouldRestartForTools (decision: RestartDecision): boolean {
  const maxRestarts = decision.maxRestarts ?? MAX_TOOL_REFRESHES
  const stepBudget = decision.stepBudget ?? TURN_STEP_BUDGET
  if (!decision.toolsChanged) return false
  if (decision.finishReason !== 'tool-calls') return false
  if (decision.restartsDone >= maxRestarts) return false
  if (decision.stepsUsed >= stepBudget) return false
  return true
}
