/**
 * stateless unit tests for checkQuota: derived daily/weekly/monthly money limits
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { checkQuota, computeCost, firstQuotaViolation, isUntrustedRole, isSelfTestModeration, type UsageInfo, type UsageLimits } from '../../../api/src/usage/operations.ts'

function mkUsage (daily: number, weekly: number, monthly: number): UsageInfo {
  return {
    daily: { cost: daily, resetsAt: '2030-01-02T00:00:00.000Z' },
    weekly: { cost: weekly, resetsAt: '2030-01-06T00:00:00.000Z' },
    monthly: { cost: monthly, resetsAt: '2030-02-01T00:00:00.000Z' }
  }
}

test.describe('checkQuota (money-based, derived periods)', () => {
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

test.describe('computeCost', () => {
  test('computes cost from tokens and prices per million', () => {
    // 500k input @ $2/M + 100k output @ $6/M = 1 + 0.6 = 1.6
    assert.equal(computeCost(500_000, 100_000, 2, 6), 1.6)
  })

  test('zero tokens → zero cost', () => {
    assert.equal(computeCost(0, 0, 10, 20), 0)
  })

  test('zero prices → zero cost', () => {
    assert.equal(computeCost(1_000_000, 1_000_000, 0, 0), 0)
  })
})

test.describe('isSelfTestModeration', () => {
  test('admin with the opt-in header is true', () => {
    assert.equal(isSelfTestModeration('admin', 'yes'), true)
  })
  test('admin without the header is false', () => {
    assert.equal(isSelfTestModeration('admin', undefined), false)
  })
  test('admin with a non-yes header value is false', () => {
    assert.equal(isSelfTestModeration('admin', 'true'), false)
  })
  test('non-admin roles are never self-test even with the header', () => {
    for (const role of ['contrib', 'user', 'external', 'anonymous']) {
      assert.equal(isSelfTestModeration(role, 'yes'), false)
    }
  })
})
