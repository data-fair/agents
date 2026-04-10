import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'

export interface TokenUsage {
  owner: { type: string, id: string }
  userId?: string
  userName?: string
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

export async function getUsage (owner: AccountKeys, userId?: string): Promise<UsageInfo> {
  const dailyPeriod = getDailyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  const filter = { 'owner.type': owner.type, 'owner.id': owner.id, ...(userId ? { userId } : {}) }

  const [daily, monthly] = await Promise.all([
    mongo.usage.findOne({ ...filter, period: dailyPeriod }),
    mongo.usage.findOne({ ...filter, period: monthlyPeriod })
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

export async function recordUsage (owner: AccountKeys, inputTokens: number, outputTokens: number, userId?: string, userName?: string): Promise<void> {
  const totalTokens = inputTokens + outputTokens
  const now = new Date().toISOString()

  const dailyPeriod = getDailyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  const filter = { 'owner.type': owner.type, 'owner.id': owner.id, ...(userId ? { userId } : {}) }
  const setOnInsertBase = { owner: { type: owner.type, id: owner.id }, ...(userId ? { userId } : {}) }
  const setFields: Record<string, string> = { updatedAt: now }
  if (userName) setFields.userName = userName

  const ops = [
    mongo.usage.updateOne(
      { ...filter, period: dailyPeriod },
      {
        $inc: { inputTokens, outputTokens, totalTokens },
        $set: setFields,
        $setOnInsert: { ...setOnInsertBase, period: dailyPeriod }
      },
      { upsert: true }
    ),
    mongo.usage.updateOne(
      { ...filter, period: monthlyPeriod },
      {
        $inc: { inputTokens, outputTokens, totalTokens },
        $set: setFields,
        $setOnInsert: { ...setOnInsertBase, period: monthlyPeriod }
      },
      { upsert: true }
    )
  ]

  // for org owners with per-user tracking, also upsert account-level aggregate records
  // this ensures account-level totals survive per-user cleanup
  if (userId) {
    const accountFilter = { 'owner.type': owner.type, 'owner.id': owner.id, userId: { $exists: false } } as any
    const accountSetOnInsert = { owner: { type: owner.type, id: owner.id } }
    ops.push(
      mongo.usage.updateOne(
        { ...accountFilter, period: dailyPeriod },
        {
          $inc: { inputTokens, outputTokens, totalTokens },
          $set: { updatedAt: now },
          $setOnInsert: { ...accountSetOnInsert, period: dailyPeriod }
        },
        { upsert: true }
      ),
      mongo.usage.updateOne(
        { ...accountFilter, period: monthlyPeriod },
        {
          $inc: { inputTokens, outputTokens, totalTokens },
          $set: { updatedAt: now },
          $setOnInsert: { ...accountSetOnInsert, period: monthlyPeriod }
        },
        { upsert: true }
      )
    )
  }

  await Promise.all(ops)
}

export async function getOwnerUsage (owner: AccountKeys): Promise<UsageInfo> {
  // account-level records (no userId) are maintained by recordUsage for both
  // personal accounts and organizations, so a simple findOne is sufficient
  const dailyPeriod = getDailyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  const filter = { 'owner.type': owner.type, 'owner.id': owner.id, userId: { $exists: false } }

  const [daily, monthly] = await Promise.all([
    mongo.usage.findOne({ ...filter, period: dailyPeriod }),
    mongo.usage.findOne({ ...filter, period: monthlyPeriod })
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

export interface UsageEntry {
  label: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface UserDailyHistory {
  userId: string
  userName?: string
  entries: UsageEntry[]
}

function getDailyPeriodForDate (date: Date): string {
  return `daily:${date.toISOString().slice(0, 10)}`
}

function dateRange (days: number): { from: string, to: string, dates: string[] } {
  const now = new Date()
  const to = getDailyPeriodForDate(now)
  const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days + 1))
  const from = getDailyPeriodForDate(fromDate)

  const dates: string[] = []
  const cursor = new Date(fromDate)
  for (let i = 0; i < days; i++) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return { from, to, dates }
}

function monthRange (months: number): { from: string, to: string, labels: string[] } {
  const now = new Date()
  const to = `monthly:${now.toISOString().slice(0, 7)}`
  const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1))
  const from = `monthly:${fromDate.toISOString().slice(0, 7)}`

  const labels: string[] = []
  const cursor = new Date(fromDate)
  for (let i = 0; i < months; i++) {
    labels.push(cursor.toISOString().slice(0, 7))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return { from, to, labels }
}

export async function getAccountDailyHistory (owner: AccountKeys, days: number = 30): Promise<UsageEntry[]> {
  const { from, to, dates } = dateRange(days)

  // account-level records have no userId (both personal and org)
  const records = await mongo.usage.find({
    'owner.type': owner.type,
    'owner.id': owner.id,
    userId: { $exists: false },
    period: { $gte: from, $lte: to }
  }).toArray()

  const byDate = new Map(records.map(r => [r.period.slice(6), r]))

  return dates.map(date => {
    const record = byDate.get(date)
    return {
      label: date,
      inputTokens: record?.inputTokens ?? 0,
      outputTokens: record?.outputTokens ?? 0,
      totalTokens: record?.totalTokens ?? 0
    }
  })
}

export async function getAccountMonthlyHistory (owner: AccountKeys, months: number = 12): Promise<UsageEntry[]> {
  const { from, to, labels } = monthRange(months)

  const records = await mongo.usage.find({
    'owner.type': owner.type,
    'owner.id': owner.id,
    userId: { $exists: false },
    period: { $gte: from, $lte: to }
  }).toArray()

  const byMonth = new Map(records.map(r => [r.period.slice(8), r]))

  return labels.map(label => {
    const record = byMonth.get(label)
    return {
      label,
      inputTokens: record?.inputTokens ?? 0,
      outputTokens: record?.outputTokens ?? 0,
      totalTokens: record?.totalTokens ?? 0
    }
  })
}

export async function getUsersDailyHistory (owner: AccountKeys, days: number = 7): Promise<UserDailyHistory[]> {
  const { from, to, dates } = dateRange(days)

  const records = await mongo.usage.find({
    'owner.type': owner.type,
    'owner.id': owner.id,
    userId: { $exists: true },
    period: { $gte: from, $lte: to }
  } as any).toArray()

  const byUser = new Map<string, { dateMap: Map<string, TokenUsage>, userName?: string }>()
  for (const r of records) {
    if (!r.userId) continue
    if (!byUser.has(r.userId)) byUser.set(r.userId, { dateMap: new Map(), userName: r.userName })
    const entry = byUser.get(r.userId)!
    entry.dateMap.set(r.period.slice(6), r)
    if (r.userName) entry.userName = r.userName
  }

  return Array.from(byUser.entries()).map(([userId, { dateMap, userName }]) => ({
    userId,
    userName,
    entries: dates.map(date => {
      const record = dateMap.get(date)
      return {
        label: date,
        inputTokens: record?.inputTokens ?? 0,
        outputTokens: record?.outputTokens ?? 0,
        totalTokens: record?.totalTokens ?? 0
      }
    })
  }))
}
