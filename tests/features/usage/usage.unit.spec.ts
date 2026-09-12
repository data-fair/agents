/**
 * stateless unit tests for checkQuota: derived daily/weekly/monthly money limits
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { checkQuota, computeCost, firstQuotaViolation, isUntrustedRole, type UsageInfo, type UsageLimits } from '../../../api/src/usage/operations.ts'

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
    assert.equal(computeCost({ inputTokens: 500_000, outputTokens: 100_000 }, { inputPricePerMillion: 2, outputPricePerMillion: 6 }), 1.6)
  })

  test('zero tokens → zero cost', () => {
    assert.equal(computeCost({ inputTokens: 0, outputTokens: 0 }, { inputPricePerMillion: 10, outputPricePerMillion: 20 }), 0)
  })

  test('zero prices → zero cost', () => {
    assert.equal(computeCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, { inputPricePerMillion: 0, outputPricePerMillion: 0 }), 0)
  })
})

test.describe('computeCost with cache tokens', () => {
  const prices = {
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    cachedInputPricePerMillion: 0.3,
    cacheWritePricePerMillion: 3.75
  }

  test('no cache details → whole input billed at input price', () => {
    const cost = computeCost({ inputTokens: 1_000_000, outputTokens: 0 }, prices)
    assert.equal(cost, 3)
  })

  test('noCacheTokens is taken verbatim, never recomputed', () => {
    // total 1M of which 900k were cache reads
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 100_000, cacheReadTokens: 900_000 },
      prices
    )
    // 100k * 3/1M + 900k * 0.3/1M
    assert.equal(cost, 0.3 + 0.27)
  })

  test('falls back to subtraction when noCacheTokens is absent', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 900_000 },
      prices
    )
    assert.equal(cost, 0.3 + 0.27)
  })

  test('cache writes are billed at the write price', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheWriteTokens: 1_000_000 },
      prices
    )
    assert.equal(cost, 3.75)
  })

  test('subtraction fallback never goes negative', () => {
    const cost = computeCost(
      { inputTokens: 100, outputTokens: 0, cacheReadTokens: 900 },
      prices
    )
    assert.equal(cost, 900 * 0.3 / 1_000_000)
  })

  test('missing cache prices default to 0, not to the input price', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheReadTokens: 1_000_000 },
      { inputPricePerMillion: 3, outputPricePerMillion: 15 }
    )
    assert.equal(cost, 0)
  })

  test('output tokens still billed', () => {
    const cost = computeCost({ inputTokens: 0, outputTokens: 1_000_000 }, prices)
    assert.equal(cost, 15)
  })
})
