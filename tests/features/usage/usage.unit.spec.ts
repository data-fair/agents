/**
 * stateless unit tests for checkQuota: derived daily/weekly/monthly credit limits
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { checkQuota, computeCredits, computeCreditBreakdown, priceTokens, priceTokensBreakdown, toCredits, firstQuotaViolation, isUntrustedRole, encodeBreakdownKey, decodeBreakdownKey, type UsageInfo, type UsageLimits } from '../../../api/src/usage/operations.ts'

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

test.describe('computeCredits', () => {
  test('prices the tokens then converts to credits, in one call', () => {
    // 1M fresh input at 0.40 EUR/M = 0.40 EUR = exactly 1 credit at the 0.40 peg
    const credits = computeCredits(
      { inputTokens: 1_000_000, outputTokens: 0 },
      { inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 },
      0.4
    )
    assert.equal(credits, 1)
  })

  test('a cached turn costs strictly less than the same turn uncached', () => {
    const prices = { inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 }
    const uncached = computeCredits({ inputTokens: 1_000_000, outputTokens: 0 }, prices, 0.4)
    const cached = computeCredits({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 100_000, cacheReadTokens: 900_000 }, prices, 0.4)
    assert.equal(uncached, 1)
    // 100k @0.40 + 900k @0.08 = 0.112 EUR = 0.28 credits
    assert.ok(cached < uncached)
    assert.equal(Number(cached.toFixed(10)), 0.28)
  })
})

test.describe('priceTokensBreakdown', () => {
  const prices = { inputPricePerMillion: 3, outputPricePerMillion: 15, cachedInputPricePerMillion: 0.3 }

  test('splits fresh input, cached input and output', () => {
    const breakdown = priceTokensBreakdown(
      { inputTokens: 1_000_000, outputTokens: 100_000, noCacheTokens: 400_000, cacheReadTokens: 600_000 },
      prices
    )
    assert.equal(breakdown.input, 1.2)
    assert.equal(breakdown.cachedInput, 0.18)
    assert.equal(breakdown.output, 1.5)
    assert.equal(breakdown.total, 1.2 + 0.18 + 1.5)
  })

  test('cache writes bill with fresh input in the input class', () => {
    const breakdown = priceTokensBreakdown(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 400_000, cacheReadTokens: 200_000, cacheWriteTokens: 400_000 },
      prices
    )
    assert.equal(breakdown.input, (400_000 + 400_000) * 3 / 1_000_000)
    assert.equal(breakdown.cachedInput, 0.06)
  })

  test('the classes always sum to the historical priceTokens total', () => {
    const counts = { inputTokens: 1_000_000, outputTokens: 100_000, noCacheTokens: 400_000, cacheReadTokens: 200_000, cacheWriteTokens: 400_000 }
    const breakdown = priceTokensBreakdown(counts, prices)
    const historical = priceTokens(counts, prices)
    assert.equal(breakdown.total, historical.total)
    assert.equal(breakdown.input + breakdown.cachedInput, historical.input)
  })
})

test.describe('computeCreditBreakdown', () => {
  test('splits credits by token class and totals like computeCredits', () => {
    const counts = { inputTokens: 1_000_000, outputTokens: 100_000, noCacheTokens: 500_000, cacheReadTokens: 500_000, cacheWriteTokens: 0 }
    const prices = { inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 }
    const breakdown = computeCreditBreakdown(counts, prices, 0.4)
    assert.equal(breakdown.total, computeCredits(counts, prices, 0.4))
    // 500k @0.40 = 0.20 EUR = 0.5 credit, 500k @0.08 = 0.04 EUR = 0.1 credit, 100k @0.80 = 0.08 EUR = 0.2 credit
    assert.equal(Number(breakdown.input.toFixed(10)), 0.5)
    assert.equal(Number(breakdown.cachedInput.toFixed(10)), 0.1)
    assert.equal(Number(breakdown.output.toFixed(10)), 0.2)
    assert.equal(Number(breakdown.total.toFixed(10)), 0.8)
  })
})

test.describe('breakdown key encoding', () => {
  test('escapes the characters MongoDB field paths reject', () => {
    assert.equal(encodeBreakdownKey('gpt-3.5-turbo'), 'gpt-3%2E5-turbo')
    assert.equal(encodeBreakdownKey('$weird'), '%24weird')
    assert.equal(encodeBreakdownKey('100%'), '100%25')
  })

  test('round-trips model ids with dots and other special characters', () => {
    for (const value of ['gpt-3.5-turbo', 'meta-llama/Llama-3.1-8B', 'a$b.c%d', 'assistant']) {
      assert.equal(decodeBreakdownKey(encodeBreakdownKey(value)), value)
    }
  })
})
