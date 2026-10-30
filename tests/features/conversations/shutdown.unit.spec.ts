import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { drainLiveRuns, acceptingTurns, stopAcceptingTurns, assertAcceptingTurns, SHUTTING_DOWN } from '../../../api/src/conversations/shutdown.ts'
import { TurnStopped, stopCauseOf } from '../../../api/src/conversations/interrupted-turn.ts'

const liveRuns = new Map<string, { controller: AbortController }>()

// A live turn as the executor registers it, ending on its own after `ms` or when aborted.
const fakeTurn = (id: string, ms: number) => {
  const controller = new AbortController()
  liveRuns.set(id, { controller })
  const end = () => liveRuns.delete(id)
  const timer = setTimeout(end, ms)
  controller.signal.addEventListener('abort', () => { clearTimeout(timer); setTimeout(end, 20) })
  return controller
}

test.describe('shutdown drain', () => {
  test.afterEach(() => liveRuns.clear())

  test('a turn that finishes within the grace period is left to finish', async () => {
    const controller = fakeTurn('quick', 100)
    const drained = await drainLiveRuns(liveRuns, 2000, { pollMs: 10 })
    assert.deepEqual(drained, { finished: 1, stopped: 0 })
    assert.equal(controller.signal.aborted, false)
  })

  test('a turn still running at the end of the grace period is stopped as a restart, and settles', async () => {
    const quick = fakeTurn('quick', 50)
    const long = fakeTurn('long', 60_000)
    const ticks: number[] = []
    const drained = await drainLiveRuns(liveRuns, 200, { pollMs: 10, settleMs: 1000, onTick: () => ticks.push(liveRuns.size) })
    assert.deepEqual(drained, { finished: 1, stopped: 1 })
    assert.equal(quick.signal.aborted, false)
    assert.ok(long.signal.reason instanceof TurnStopped)
    assert.equal(stopCauseOf(long.signal.reason), 'shutdown')
    assert.equal(long.signal.reason.message, 'the server restarted')
    // Waited for the stopped turn to settle, and the server was told at each poll which turns remained.
    assert.equal(liveRuns.size, 0)
    assert.equal(ticks[0], 2)
    assert.ok(ticks.includes(1))
  })

  test('nothing live: returns at once', async () => {
    const started = Date.now()
    assert.deepEqual(await drainLiveRuns(liveRuns, 5000), { finished: 0, stopped: 0 })
    assert.ok(Date.now() - started < 500)
  })

  // Last: the flag is process-wide and never set back.
  test('once shutdown begins, a new turn is refused with a 503 saying to send again', () => {
    assert.equal(acceptingTurns(), true)
    assert.doesNotThrow(assertAcceptingTurns)
    stopAcceptingTurns()
    assert.equal(acceptingTurns(), false)
    assert.throws(assertAcceptingTurns, (err: any) => err.status === 503 && err.message === SHUTTING_DOWN)
  })
})
