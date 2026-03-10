import assert from 'node:assert/strict'
import { test as teardown } from '@playwright/test'

// Unit block: test pure functions from operations.ts
teardown('Stateful tests teardown', () => {
  const pid = process.env.TAIL_PID
  assert.ok(pid, 'Tail process PID is not defined')
  process.kill(parseInt(pid))
})
