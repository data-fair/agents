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

export interface QuotaWindow {
  used: number
  // absent when the quota is not enforced (unlimited, or monthlyLimit <= 0)
  limit?: number
  resetsAt: string
}

export interface SelfQuota {
  unlimited: boolean
  daily: QuotaWindow
  weekly: QuotaWindow
  monthly: QuotaWindow
}

export interface SelfUsage {
  role: 'admin' | 'contrib' | 'user' | 'external' | 'anonymous'
  quota: SelfQuota
  account: { status: 'ok' | 'exhausted', resetsAt?: string, used?: number, limit?: number }
}

/**
 * The three enforced windows of a quota, derived from its monthly limit
 * (weekly = monthly / 2, daily = monthly / 4). The single source of these
 * ratios: checkQuota() enforces exactly what this reports.
 */
export function quotaWindows (usage: UsageInfo, limits: UsageLimits | undefined): SelfQuota {
  const monthlyLimit = limits?.monthlyLimit ?? 0
  const unlimited = !!limits?.unlimited || monthlyLimit <= 0
  const window = (period: UsagePeriodInfo, limit: number): QuotaWindow =>
    unlimited ? { used: period.cost, resetsAt: period.resetsAt } : { used: period.cost, limit, resetsAt: period.resetsAt }
  return {
    unlimited,
    daily: window(usage.daily, monthlyLimit / 4),
    weekly: window(usage.weekly, monthlyLimit / 2),
    monthly: window(usage.monthly, monthlyLimit)
  }
}

const PERIOD_REASONS = {
  daily: 'Daily cost quota exceeded',
  weekly: 'Weekly cost quota exceeded',
  monthly: 'Monthly cost quota exceeded'
} as const

// Scopes whose numbers are the account's, not the caller's own.
const SHARED_SCOPES = new Set(['account', 'untrusted'])

/**
 * The `error` object of a 429. `usage`/`limit` of a shared budget (the org credit
 * cap, the anonymous+external pool) are only disclosed to an admin of the owner.
 */
export function quotaErrorBody (violation: QuotaExceeded, isAdmin: boolean) {
  const disclose = isAdmin || !SHARED_SCOPES.has(violation.scope)
  return {
    message: violation.reason,
    type: 'rate_limit_error' as const,
    scope: violation.scope,
    period: violation.period,
    resets_at: violation.resetsAt,
    ...(disclose ? { usage: violation.usage, limit: violation.limit } : {})
  }
}

export function checkQuota (usage: UsageInfo, limits: UsageLimits, scope: string): QuotaExceeded | null {
  const windows = quotaWindows(usage, limits)
  if (windows.unlimited) return null
  for (const period of ['daily', 'weekly', 'monthly'] as const) {
    const w = windows[period]
    if (w.used >= w.limit!) {
      return { allowed: false, reason: PERIOD_REASONS[period], scope, period, usage: w.used, limit: w.limit!, resetsAt: w.resetsAt }
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

/** Cost in euros per token class, so the stacked histograms can attribute credits. */
export interface TokenPriceBreakdown {
  /** Non-cached input tokens plus cache writes (billed at the plain input price). */
  input: number
  /** Cache read tokens at the cache tariff (0 when none is configured). */
  cachedInput: number
  output: number
  total: number
}

/**
 * Cost in euros, split by token class and totalled, so the trace breakdown, the
 * billed total and the usage breakdown all come from one computation instead of
 * several that can drift apart.
 *
 * ai@6 normalizes the provider disagreement about whether `inputTokens` includes
 * cache reads: `inputTokens` is always the total and `noCacheTokens` the billable
 * remainder. Take `noCacheTokens` verbatim when present; the subtraction is only a
 * fallback for providers/mocks that omit the detail.
 */
export function priceTokensBreakdown (counts: TokenCounts, prices: TokenPrices): TokenPriceBreakdown {
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
  const input = (atInputPrice * prices.inputPricePerMillion) / 1_000_000
  const cachedInput = (cacheRead * (prices.cachedInputPricePerMillion ?? 0)) / 1_000_000
  const output = (counts.outputTokens * prices.outputPricePerMillion) / 1_000_000
  return { input, cachedInput, output, total: input + cachedInput + output }
}

/** Historical shape kept for the trace view: `input` includes cache reads. */
export function priceTokens (counts: TokenCounts, prices: TokenPrices): { input: number, output: number, total: number } {
  const breakdown = priceTokensBreakdown(counts, prices)
  return { input: breakdown.input + breakdown.cachedInput, output: breakdown.output, total: breakdown.total }
}

/** Euros to the billed unit. The peg is deployment-global config (`eurosPerCredit`). */
export function toCredits (euros: number, eurosPerCredit: number): number {
  return euros / eurosPerCredit
}

/** The billed credits, split by token class. */
export interface CreditBreakdown {
  input: number
  cachedInput: number
  output: number
  total: number
}

export function computeCreditBreakdown (counts: TokenCounts, prices: TokenPrices, eurosPerCredit: number): CreditBreakdown {
  const breakdown = priceTokensBreakdown(counts, prices)
  return {
    input: toCredits(breakdown.input, eurosPerCredit),
    cachedInput: toCredits(breakdown.cachedInput, eurosPerCredit),
    output: toCredits(breakdown.output, eurosPerCredit),
    total: toCredits(breakdown.total, eurosPerCredit)
  }
}

/** The single entry point every call site uses: token counts to billed credits. */
export function computeCredits (counts: TokenCounts, prices: TokenPrices, eurosPerCredit: number): number {
  return computeCreditBreakdown(counts, prices, eurosPerCredit).total
}

/**
 * Breakdown maps are stored as nested objects on the usage documents and incremented
 * with `$inc`, so their keys are MongoDB field path segments: '.' separates fields and
 * may not appear in a key, and a leading '$' is rejected by older servers. Model ids
 * routinely contain dots (gpt-3.5-turbo), hence the escape. Percent-encoding is
 * injective and keeps most values human-readable in the database.
 */
export function encodeBreakdownKey (value: string): string {
  return value.replace(/%/g, '%25').replace(/\./g, '%2E').replace(/\$/g, '%24')
}

export function decodeBreakdownKey (key: string): string {
  return key.replace(/%24/g, '$').replace(/%2E/g, '.').replace(/%25/g, '%')
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
/**
 * Sentinel userId of the shared pool that anonymous and external usage both contribute to.
 *
 * Lives in the PURE module so a caller that only needs to label a usage identity does not have to
 * import `enforce.ts`, which reaches mongo and config through its own imports and so cannot be
 * reached from a unit test.
 */
export const UNTRUSTED_POOL_ID = 'pool:untrusted'

export function isUntrustedRole (role: string): boolean {
  return role === 'anonymous' || role === 'external'
}
