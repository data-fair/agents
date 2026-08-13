/**
 * stateless unit tests for checkQuota: derived daily/weekly/monthly credit limits
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { checkQuota, computeCredits, firstQuotaViolation, isUntrustedRole, type UsageInfo, type UsageLimits } from '../../../api/src/usage/operations.ts'

function mkUsage (daily: number, weekly: number, monthly: number): UsageInfo {
  return {
    daily: { cost: daily, resetsAt: '2030-01-02T00:00:00.000Z' },
    weekly: { cost: weekly, resetsAt: '2030-01-06T00:00:00.000Z' },
    monthly: { cost: monthly, resetsAt: '2030-02-01T00:00:00.000Z' }
  }
}

test.describe('checkQuota (credit-based, derived periods)', () => {
  test('unlimited → no violation', () => {
    const limits: UsageLimits = { unlimited: true, monthlyLimit: 0 }
    assert.equal(checkQuota(mkUsage(1000, 1000, 1000), limits, 'user'), null)
  })

  test('no positive limit → no violation', () => {
    const limits: UsageLimits = { unlimited: false, monthlyLimit: 0 }
    assert.equal(checkQuota(mkUsage(1000, 1000, 1000), limits, 'user'), null)
  })

  test('daily breach first (monthly=4 → daily=1)', () => {
    const limits: UsageLimits = { unlimited: false, monthlyLimit: 4 }
    const v = checkQuota(mkUsage(1, 0, 0), limits, 'user')
    assert.ok(v)
    assert.equal(v!.period, 'daily')
    assert.equal(v!.limit, 1)
  })

  test('weekly breach when daily ok (monthly=4 → weekly=2)', () => {
    const limits: UsageLimits = { unlimited: false, monthlyLimit: 4 }
    const v = checkQuota(mkUsage(0.5, 2, 2), limits, 'user')
    assert.ok(v)
    assert.equal(v!.period, 'weekly')
    assert.equal(v!.limit, 2)
  })

  test('monthly breach when daily/weekly ok', () => {
    const limits: UsageLimits = { unlimited: false, monthlyLimit: 4 }
    const v = checkQuota(mkUsage(0.5, 1.5, 4), limits, 'user')
    assert.ok(v)
    assert.equal(v!.period, 'monthly')
    assert.equal(v!.limit, 4)
  })

  test('below all limits → no violation', () => {
    const limits: UsageLimits = { unlimited: false, monthlyLimit: 4 }
    assert.equal(checkQuota(mkUsage(0.5, 1.5, 3.5), limits, 'user'), null)
  })
})

test.describe('firstQuotaViolation (ordered checks)', () => {
  test('returns the first violation, skipping null/undefined checks', () => {
    const ok = { usage: mkUsage(0, 0, 0), limits: { unlimited: false, monthlyLimit: 100 } as UsageLimits, scope: 'user' }
    // monthly=40 → monthly cost 50 breaches
    const poolBreached = { usage: mkUsage(0, 0, 50), limits: { unlimited: false, monthlyLimit: 40 } as UsageLimits, scope: 'untrusted' }
    const v = firstQuotaViolation([null, ok, poolBreached, ok])
    assert.ok(v)
    assert.equal(v!.scope, 'untrusted')
    assert.equal(v!.period, 'monthly')
    assert.equal(v!.limit, 40)
  })

  test('returns null when all checks pass or are absent', () => {
    const ok = { usage: mkUsage(0, 0, 0), limits: { unlimited: false, monthlyLimit: 100 } as UsageLimits, scope: 'user' }
    assert.equal(firstQuotaViolation([null, ok, undefined]), null)
  })
})

test.describe('isUntrustedRole', () => {
  test('anonymous and external are untrusted', () => {
    assert.equal(isUntrustedRole('anonymous'), true)
    assert.equal(isUntrustedRole('external'), true)
  })

  test('member roles are trusted', () => {
    assert.equal(isUntrustedRole('admin'), false)
    assert.equal(isUntrustedRole('contrib'), false)
    assert.equal(isUntrustedRole('user'), false)
  })
})

test.describe('computeCredits', () => {
  test('applies the output weight and multiplier', () => {
    // (1_000_000 input + 250_000 output * 4) / 1e6 * 1.5 = 3
    assert.equal(computeCredits(1_000_000, 250_000, 1.5, 4), 3)
  })
  test('zero multiplier means zero credits', () => {
    assert.equal(computeCredits(500, 500, 0, 4), 0)
  })
  test('zero tokens means zero credits', () => {
    assert.equal(computeCredits(0, 0, 10, 4), 0)
  })
})
