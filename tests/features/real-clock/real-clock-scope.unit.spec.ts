/**
 * In development, the real-clock jobs (task scheduler, memory consolidation, run recovery) leave alone the owners
 * whose clock is driven elsewhere: the suites' test_agents_ sub-space (through the test-env seams) and the
 * simulations' test_sim_ contexts (judged on what the runner itself did). The dev world's test_demo_ keeps it.
 */
import { test } from '@playwright/test'
import assert from 'node:assert/strict'
import { realClockScope } from '../../../api/src/real-clock-scope.ts'

const keeps = (scope: Record<string, any>, ownerId: string) => {
  const rule = scope['owner.id']?.$not as RegExp | undefined
  return !rule || !rule.test(ownerId)
}

test.describe('realClockScope', () => {
  test('in development, skips the suites\' and the simulations\' owners, keeps the dev world and the rest', () => {
    const scope = realClockScope('development')
    assert.equal(keeps(scope, 'test_agents_org1'), false)
    assert.equal(keeps(scope, 'test_sim_scheduled_task_run_org1'), false)
    assert.equal(keeps(scope, 'test_demo_org'), true)
    assert.equal(keeps(scope, 'koumoul'), true)
    assert.equal(keeps(scope, 'test_agentsx'), true)
  })

  test('outside development, the real clock runs for everyone', () => {
    assert.deepEqual(realClockScope('production'), {})
    assert.deepEqual(realClockScope(undefined), {})
  })
})
