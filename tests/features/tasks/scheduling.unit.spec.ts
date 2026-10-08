import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { toCron, nextRunAfter, minGapSeconds } from '../../../api/src/tasks/operations.ts'
import { describeScheduling } from '../../../shared/task-schedule.ts'

const daily = (hour: number, minute = 0, timeZone = 'Europe/Paris') => ({ type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour, minute, timeZone }) as any
const hourly = (hourStep: number, minute = 0) => ({ type: 'hours', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: '*', hourStep, minute, timeZone: 'UTC' }) as any
const weekly = (dayOfWeek: string, hour: number) => ({ type: 'weekly', month: '*', dayOfMonth: '*', dayOfWeek, hour, minute: 0, timeZone: 'UTC' }) as any

test.describe('task scheduling', () => {
  test('rules become cron like processings', () => {
    assert.equal(toCron(daily(8, 30)), '30 8 * * *')
    assert.equal(toCron(hourly(2, 5)), '5 */2 * * *')
    assert.equal(toCron(weekly('1', 9)), '0 9 * * 1')
  })

  test('the next slot is strictly after the given time, in the rule\'s time zone', () => {
    // 07:00 UTC on a winter day is 08:00 in Paris: an 08:00 Paris rule at exactly that instant runs the next day.
    const at = new Date('2026-01-15T07:00:00.000Z')
    assert.equal(nextRunAfter([daily(8)], at).toISOString(), '2026-01-16T07:00:00.000Z')
    assert.equal(nextRunAfter([daily(8)], new Date('2026-01-15T06:59:00.000Z')).toISOString(), '2026-01-15T07:00:00.000Z')
  })

  test('several rules: the earliest wins', () => {
    const at = new Date('2026-01-15T00:00:00.000Z')
    assert.equal(nextRunAfter([weekly('1', 9), daily(3, 0, 'UTC')], at).toISOString(), '2026-01-15T03:00:00.000Z')
  })

  test('the minimum gap catches an hourly rule and two rules close together', () => {
    const from = new Date('2026-01-15T00:00:00.000Z')
    assert.equal(minGapSeconds([hourly(1)], from), 3600)
    assert.equal(minGapSeconds([daily(8, 0, 'UTC'), daily(8, 10, 'UTC')], from), 600)
  })

  test('a schedule is described in words, per locale', () => {
    assert.equal(describeScheduling([daily(8, 5)], 'en'), 'every day at 08:05 (Europe/Paris)')
    assert.equal(describeScheduling([weekly('1', 9), hourly(2)], 'en'), 'every Monday at 09:00 (UTC); every 2 hours at minute 00 (UTC)')
    assert.equal(describeScheduling([daily(8)], 'fr'), 'tous les jours à 08:00 (Europe/Paris)')
  })
})
