import { test as teardown } from '@playwright/test'
import { releaseStatefulLock } from './support/stateful-lock.ts'

// Unit block: test pure functions from operations.ts
teardown('Stateful tests teardown', () => {
  // Released first, so a failure below cannot leave the next run waiting on a lock — though a lock
  // left behind would be taken over anyway once this run's process is gone.
  releaseStatefulLock()
  // No tail when setup stopped before spawning it — most often because it REFUSED a second concurrent
  // run. Asserting here added a second failure that buried the one message that mattered.
  const pid = process.env.TAIL_PID
  if (pid) process.kill(parseInt(pid))
})
