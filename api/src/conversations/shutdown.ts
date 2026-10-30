/**
 * Shutdown. A deploy stops this process; the turns it holds cannot migrate, and a turn that has begun is
 * never resumed elsewhere (recoverOwnerlessRuns). So, on SIGTERM, instead of dying with them:
 *
 * 1. stopAcceptingTurns: no new turn begins here. A prompt, a decision or run now is refused with a 503
 *    saying to try again; a queued run that has not begun is left for another instance to resume
 *    (startRun stops picking them up, and it has no assistant message, so recovery resumes it).
 * 2. drainLiveRuns: the running turns get `graceMs` to finish normally, then the rest are stopped as
 *    `shutdown` ("the server restarted") and settled by their own process — an aborted run, not an
 *    interrupted one, so a task run cut short by a deploy is neither notified nor counted toward its
 *    task's pause. Settling writes to mongo, hence the bounded wait after the abort.
 *
 * Pure — the live-run map is passed in — so it is unit-testable without the database.
 */
import { httpError } from '@data-fair/lib-express'
import { TurnStopped } from './interrupted-turn.ts'

let accepting = true

export const SHUTTING_DOWN = 'the service is restarting: send this again in a moment'

/** False once shutdown has begun. */
export const acceptingTurns = () => accepting

export const stopAcceptingTurns = () => { accepting = false }

/** Throws a 503 once shutdown has begun: the guard at every place a new turn begins. */
export const assertAcceptingTurns = () => {
  if (!accepting) throw httpError(503, SHUTTING_DOWN)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Give the live turns `graceMs` to finish, then stop the rest as `shutdown` and wait `settleMs` for them
 * to settle. `onTick` runs at each poll, with the turns still live (the server closes the sockets whose
 * turn has ended).
 */
export const drainLiveRuns = async (
  liveRuns: Map<string, { controller: AbortController }>,
  graceMs: number,
  opts: { settleMs?: number, pollMs?: number, onTick?: () => void } = {}
): Promise<{ finished: number, stopped: number }> => {
  const { settleMs = 10_000, pollMs = 200, onTick } = opts
  const until = async (deadline: number) => {
    onTick?.()
    while (liveRuns.size && Date.now() < deadline) {
      await sleep(pollMs)
      onTick?.()
    }
  }
  const initial = liveRuns.size
  await until(Date.now() + graceMs)
  const remaining = [...liveRuns.values()]
  for (const live of remaining) live.controller.abort(new TurnStopped('shutdown'))
  await until(Date.now() + settleMs)
  return { finished: initial - remaining.length, stopped: remaining.length }
}
