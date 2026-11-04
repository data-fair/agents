/**
 * stateless unit tests for the approvalLevel → approvalRoutes migration (upgrade/0.12.2): each level keeps at
 * least the person it had, and the routes it writes are ones the agent schema accepts.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { routesForLevel } from '../../../upgrade/0.12.2/approval-level-to-routes.js'
import { DEFAULT_APPROVAL_ROUTES } from '../../../shared/approval-policy.ts'

test.describe('routesForLevel', () => {
  test('write keeps a person on every change', () => {
    assert.deepEqual(routesForLevel('write'), { write: 'reviewer+person', destructive: 'reviewer+person' })
  })

  test('destructive, the old default, takes the default routes, which keep the person on destructive calls', () => {
    assert.equal(routesForLevel('destructive'), undefined)
    assert.equal(DEFAULT_APPROVAL_ROUTES.destructive, 'reviewer+person')
  })

  test('none becomes the reviewer alone, there being no unchecked route', () => {
    assert.deepEqual(routesForLevel('none'), { write: 'reviewer', destructive: 'reviewer' })
  })

  test('an unknown value takes the defaults', () => {
    assert.equal(routesForLevel(undefined), undefined)
    assert.equal(routesForLevel('other'), undefined)
  })
})
