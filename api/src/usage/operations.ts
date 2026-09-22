/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

export interface UsageLimits {
  unlimited?: boolean
  monthlyLimit?: number
}

export interface UsagePeriodInfo {
  cost: number
  resetsAt: string
}

export interface UsageInfo {
  daily: UsagePeriodInfo
  weekly: UsagePeriodInfo
  monthly: UsagePeriodInfo
}

export interface QuotaExceeded {
  allowed: false
  reason: string
  scope: string
  period: 'daily' | 'weekly' | 'monthly'
  usage: number
  limit: number
  resetsAt: string
}

export function checkQuota (usage: UsageInfo, limits: UsageLimits, scope: string): QuotaExceeded | null {
  if (limits.unlimited) return null
  const monthlyLimit = limits.monthlyLimit
  if (!monthlyLimit || monthlyLimit <= 0) return null

  const weeklyLimit = monthlyLimit / 2
  const dailyLimit = monthlyLimit / 4

  if (usage.daily.cost >= dailyLimit) {
    return {
      allowed: false,
      reason: 'Daily cost quota exceeded',
      scope,
      period: 'daily',
      usage: usage.daily.cost,
      limit: dailyLimit,
      resetsAt: usage.daily.resetsAt
    }
  }
  if (usage.weekly.cost >= weeklyLimit) {
    return {
      allowed: false,
      reason: 'Weekly cost quota exceeded',
      scope,
      period: 'weekly',
      usage: usage.weekly.cost,
      limit: weeklyLimit,
      resetsAt: usage.weekly.resetsAt
    }
  }
  if (usage.monthly.cost >= monthlyLimit) {
    return {
      allowed: false,
      reason: 'Monthly cost quota exceeded',
      scope,
      period: 'monthly',
      usage: usage.monthly.cost,
      limit: monthlyLimit,
      resetsAt: usage.monthly.resetsAt
    }
  }
  return null
}

export interface TokenPrices {
  inputPricePerMillion: number
  outputPricePerMillion: number
  /**
   * Optional here only because the CATALOG resolves it (entry value, then the
   * provider-listing snapshot, then the input price). By the time a price reaches
   * this function an unset value genuinely means "no cache tariff", so it bills at
   * 0 — the "unset means unknown, not free" rule lives in getModelCatalog, not here.
   */
  cachedInputPricePerMillion?: number
}

export interface TokenCounts {
  /** TOTAL input tokens, inclusive of cache reads (ai@6 `usage.inputTokens`). */
  inputTokens: number
  outputTokens: number
  /** Non-cached portion (ai@6 `usage.inputTokenDetails.noCacheTokens`). */
  noCacheTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

/**
 * Cost in euros, split so the trace breakdown and the billed total come from one
 * computation instead of two that can drift apart.
 *
 * ai@6 normalizes the provider disagreement about whether `inputTokens` includes
 * cache reads: `inputTokens` is always the total and `noCacheTokens` the billable
 * remainder. Take `noCacheTokens` verbatim when present; the subtraction is only a
 * fallback for providers/mocks that omit the detail.
 */
export function priceTokens (counts: TokenCounts, prices: TokenPrices): { input: number, output: number, total: number } {
  const cacheRead = counts.cacheReadTokens ?? 0
  const cacheWrite = counts.cacheWriteTokens ?? 0
  const noCache = counts.noCacheTokens ?? Math.max(counts.inputTokens - cacheRead - cacheWrite, 0)
  // Cache WRITES bill at the plain input price. There is no separate write tariff to
  // configure: this codebase never sets `cache_control`, so no provider reports write
  // tokens today. They are still billed rather than dropped — both @ai-sdk/anthropic
  // and @ai-sdk/openai exclude cacheWrite from `noCache`, so omitting the term would
  // silently make them free if a provider ever did report them. Anthropic's real rate
  // is 1.25x input; billing at 1x under-bills slightly rather than not at all.
  const atInputPrice = noCache + cacheWrite
  // Divide each term individually rather than summing first and dividing once: the two
  // are not equivalent in floating point, and the test expectations are built from
  // per-term division.
  const input =
    (atInputPrice * prices.inputPricePerMillion) / 1_000_000 +
    (cacheRead * (prices.cachedInputPricePerMillion ?? 0)) / 1_000_000
  const output = (counts.outputTokens * prices.outputPricePerMillion) / 1_000_000
  return { input, output, total: input + output }
}

/** Euros to the billed unit. The peg is deployment-global config (`eurosPerCredit`). */
export function toCredits (euros: number, eurosPerCredit: number): number {
  return euros / eurosPerCredit
}

/** The single entry point every call site uses: token counts to billed credits. */
export function computeCredits (counts: TokenCounts, prices: TokenPrices, eurosPerCredit: number): number {
  return toCredits(priceTokens(counts, prices).total, eurosPerCredit)
}

export interface QuotaCheckInput {
  usage: UsageInfo
  limits: UsageLimits
  scope: string
}

/**
 * Run several quota checks in order and return the first violation, if any.
 * Used to enforce the untrusted-pool → per-user precedence in one place.
 * Null/undefined entries are skipped so callers can build the list conditionally.
 */
export function firstQuotaViolation (checks: (QuotaCheckInput | null | undefined)[]): QuotaExceeded | null {
  for (const check of checks) {
    if (!check) continue
    const violation = checkQuota(check.usage, check.limits, check.scope)
    if (violation) return violation
  }
  return null
}

/**
 * Untrusted roles are those that share the aggregate "untrusted pool" budget:
 * anonymous (public, per-IP) and external (authenticated but on a different account).
 */
export function isUntrustedRole (role: string): boolean {
  return role === 'anonymous' || role === 'external'
}
