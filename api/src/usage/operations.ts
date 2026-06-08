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

export function computeCost (inputTokens: number, outputTokens: number, inputPricePerMillion: number, outputPricePerMillion: number): number {
  return (inputTokens * inputPricePerMillion + outputTokens * outputPricePerMillion) / 1_000_000
}

export interface QuotaCheckInput {
  usage: UsageInfo
  limits: UsageLimits
  scope: string
}

/**
 * Run several quota checks in order and return the first violation, if any.
 * Used to enforce the global → untrusted-pool → per-user precedence in one place.
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
