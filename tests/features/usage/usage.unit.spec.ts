/**
 * stateless unit tests for checkQuota: derived daily/weekly/monthly credit limits
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { checkQuota, computeCredits, priceTokens, toCredits, firstQuotaViolation, isUntrustedRole, type UsageInfo, type UsageLimits } from '../../../api/src/usage/operations.ts'

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

test.describe('priceTokens', () => {
  const prices = { inputPricePerMillion: 3, outputPricePerMillion: 15, cachedInputPricePerMillion: 0.3 }

  test('prices input and output per million', () => {
    const cost = priceTokens({ inputTokens: 500_000, outputTokens: 100_000 }, { inputPricePerMillion: 2, outputPricePerMillion: 6 })
    assert.equal(cost.input, 1)
    assert.equal(cost.output, 0.6)
    assert.equal(cost.total, 1.6)
  })

  test('zero tokens cost zero', () => {
    assert.equal(priceTokens({ inputTokens: 0, outputTokens: 0 }, prices).total, 0)
  })

  test('no cache details bills the whole input at the input price', () => {
    assert.equal(priceTokens({ inputTokens: 1_000_000, outputTokens: 0 }, prices).total, 3)
  })

  test('noCacheTokens is taken verbatim, never recomputed', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 100_000, cacheReadTokens: 900_000 }, prices)
    assert.equal(cost.total, 0.3 + 0.27)
  })

  test('falls back to subtraction when noCacheTokens is absent', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 900_000 }, prices)
    assert.equal(cost.total, 0.3 + 0.27)
  })

  test('the subtraction fallback never goes negative', () => {
    const cost = priceTokens({ inputTokens: 100, outputTokens: 0, cacheReadTokens: 900 }, prices)
    assert.equal(cost.total, 900 * 0.3 / 1_000_000)
  })

  test('cache writes bill at the input price, never free', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheWriteTokens: 1_000_000 }, prices)
    assert.equal(cost.total, 3)
  })

  test('cache writes are added to the non-cached portion, not substituted for it', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 400_000, cacheReadTokens: 200_000, cacheWriteTokens: 400_000 }, prices)
    assert.equal(cost.total, 2.4 + 0.06)
  })

  test('an absent cache price bills cache reads at 0 \u2014 the catalog resolves it, not this function', () => {
    const cost = priceTokens(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheReadTokens: 1_000_000 },
      { inputPricePerMillion: 3, outputPricePerMillion: 15 }
    )
    assert.equal(cost.total, 0)
  })
})

test.describe('toCredits', () => {
  test('divides by the peg', () => {
    assert.equal(toCredits(0.4, 0.4), 1)
    assert.equal(toCredits(4, 0.4), 10)
  })
  test('a peg of 1 makes a credit a euro', () => {
    assert.equal(toCredits(2.5, 1), 2.5)
  })
  test('zero cost is zero credits whatever the peg', () => {
    assert.equal(toCredits(0, 0.4), 0)
  })
})
