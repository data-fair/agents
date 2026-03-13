import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'

export interface TokenUsage {
  owner: { type: string, id: string }
  period: string // 'daily:2026-03-13' or 'monthly:2026-03'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  updatedAt: string
}

export interface UsageLimits {
  dailyTokenLimit?: number
  monthlyTokenLimit?: number
}

export interface UsageInfo {
  daily: { inputTokens: number, outputTokens: number, totalTokens: number, limit?: number, resetsAt: string }
  monthly: { inputTokens: number, outputTokens: number, totalTokens: number, limit?: number, resetsAt: string }
}

function getDailyPeriod (): string {
  const now = new Date()
  return `daily:${now.toISOString().slice(0, 10)}`
}

function getMonthlyPeriod (): string {
  const now = new Date()
  return `monthly:${now.toISOString().slice(0, 7)}`
}

function getDailyResetsAt (): string {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return tomorrow.toISOString()
}

function getMonthlyResetsAt (): string {
  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return nextMonth.toISOString()
}

export async function getUsage (owner: AccountKeys): Promise<UsageInfo> {
  const dailyPeriod = getDailyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  const [daily, monthly] = await Promise.all([
    mongo.usage.findOne({ 'owner.type': owner.type, 'owner.id': owner.id, period: dailyPeriod }),
    mongo.usage.findOne({ 'owner.type': owner.type, 'owner.id': owner.id, period: monthlyPeriod })
  ])

  return {
    daily: {
      inputTokens: daily?.inputTokens ?? 0,
      outputTokens: daily?.outputTokens ?? 0,
      totalTokens: daily?.totalTokens ?? 0,
      resetsAt: getDailyResetsAt()
    },
    monthly: {
      inputTokens: monthly?.inputTokens ?? 0,
      outputTokens: monthly?.outputTokens ?? 0,
      totalTokens: monthly?.totalTokens ?? 0,
      resetsAt: getMonthlyResetsAt()
    }
  }
}

export async function recordUsage (owner: AccountKeys, inputTokens: number, outputTokens: number): Promise<void> {
  const totalTokens = inputTokens + outputTokens
  const now = new Date().toISOString()

  const dailyPeriod = getDailyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  await Promise.all([
    mongo.usage.updateOne(
      { 'owner.type': owner.type, 'owner.id': owner.id, period: dailyPeriod },
      {
        $inc: { inputTokens, outputTokens, totalTokens },
        $set: { updatedAt: now },
        $setOnInsert: { owner: { type: owner.type, id: owner.id }, period: dailyPeriod }
      },
      { upsert: true }
    ),
    mongo.usage.updateOne(
      { 'owner.type': owner.type, 'owner.id': owner.id, period: monthlyPeriod },
      {
        $inc: { inputTokens, outputTokens, totalTokens },
        $set: { updatedAt: now },
        $setOnInsert: { owner: { type: owner.type, id: owner.id }, period: monthlyPeriod }
      },
      { upsert: true }
    )
  ])
}

export interface QuotaExceeded {
  allowed: false
  reason: string
  scope: string
  usage: number
  limit: number
  resetsAt: string
}

export function checkQuota (usage: UsageInfo, limits: UsageLimits, scope: string): QuotaExceeded | null {
  if (limits.dailyTokenLimit && usage.daily.totalTokens >= limits.dailyTokenLimit) {
    return {
      allowed: false,
      reason: 'Daily token quota exceeded',
      scope,
      usage: usage.daily.totalTokens,
      limit: limits.dailyTokenLimit,
      resetsAt: usage.daily.resetsAt
    }
  }
  if (limits.monthlyTokenLimit && usage.monthly.totalTokens >= limits.monthlyTokenLimit) {
    return {
      allowed: false,
      reason: 'Monthly token quota exceeded',
      scope,
      usage: usage.monthly.totalTokens,
      limit: limits.monthlyTokenLimit,
      resetsAt: usage.monthly.resetsAt
    }
  }
  return null
}
