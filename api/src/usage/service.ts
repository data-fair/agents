import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'
import type { UsageInfo } from './operations.ts'
export { checkQuota } from './operations.ts'
export type { UsageLimits, UsagePeriodInfo, UsageInfo, QuotaExceeded } from './operations.ts'

export interface Usage {
  owner: { type: string, id: string }
  userId?: string
  userName?: string
  period: string // 'daily:2026-03-13' | 'weekly:2026-W11' | 'monthly:2026-03'
  cost: number
  updatedAt: string
}

function getDailyPeriod (): string {
  const now = new Date()
  return `daily:${now.toISOString().slice(0, 10)}`
}

function getIsoWeek (date: Date): { year: number, week: number } {
  // ISO 8601 week: week containing Thursday of that week, weeks start on Monday
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

function getWeeklyPeriod (): string {
  const { year, week } = getIsoWeek(new Date())
  return `weekly:${year}-W${String(week).padStart(2, '0')}`
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

function getWeeklyResetsAt (): string {
  const now = new Date()
  const dayNum = now.getUTCDay() || 7 // Mon=1..Sun=7
  const daysUntilNextMonday = 8 - dayNum
  const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilNextMonday))
  return nextMonday.toISOString()
}

function getMonthlyResetsAt (): string {
  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return nextMonth.toISOString()
}

export async function getUsage (owner: AccountKeys, userId?: string): Promise<UsageInfo> {
  const dailyPeriod = getDailyPeriod()
  const weeklyPeriod = getWeeklyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  const filter = { 'owner.type': owner.type, 'owner.id': owner.id, ...(userId ? { userId } : {}) }

  const [daily, weekly, monthly] = await Promise.all([
    mongo.usage.findOne({ ...filter, period: dailyPeriod }),
    mongo.usage.findOne({ ...filter, period: weeklyPeriod }),
    mongo.usage.findOne({ ...filter, period: monthlyPeriod })
  ])

  return {
    daily: { cost: daily?.cost ?? 0, resetsAt: getDailyResetsAt() },
    weekly: { cost: weekly?.cost ?? 0, resetsAt: getWeeklyResetsAt() },
    monthly: { cost: monthly?.cost ?? 0, resetsAt: getMonthlyResetsAt() }
  }
}

export async function recordUsage (owner: AccountKeys, cost: number, userId?: string, userName?: string): Promise<void> {
  if (!cost) return
  const now = new Date().toISOString()

  const dailyPeriod = getDailyPeriod()
  const weeklyPeriod = getWeeklyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  const filter = { 'owner.type': owner.type, 'owner.id': owner.id, ...(userId ? { userId } : {}) }
  const setOnInsertBase = { owner: { type: owner.type, id: owner.id }, ...(userId ? { userId } : {}) }
  const setFields: Record<string, string> = { updatedAt: now }
  if (userName) setFields.userName = userName

  const upsertFor = (period: string) => mongo.usage.updateOne(
    { ...filter, period },
    {
      $inc: { cost },
      $set: setFields,
      $setOnInsert: { ...setOnInsertBase, period }
    },
    { upsert: true }
  )

  const ops = [upsertFor(dailyPeriod), upsertFor(weeklyPeriod), upsertFor(monthlyPeriod)]

  // for org owners with per-user tracking, also upsert account-level aggregate records
  if (userId) {
    const accountFilter = { 'owner.type': owner.type, 'owner.id': owner.id, userId: { $exists: false } } as any
    const accountSetOnInsert = { owner: { type: owner.type, id: owner.id } }
    const accountUpsertFor = (period: string) => mongo.usage.updateOne(
      { ...accountFilter, period },
      {
        $inc: { cost },
        $set: { updatedAt: now },
        $setOnInsert: { ...accountSetOnInsert, period }
      },
      { upsert: true }
    )
    ops.push(accountUpsertFor(dailyPeriod), accountUpsertFor(weeklyPeriod), accountUpsertFor(monthlyPeriod))
  }

  await Promise.all(ops)
}

export async function getOwnerUsage (owner: AccountKeys): Promise<UsageInfo> {
  const dailyPeriod = getDailyPeriod()
  const weeklyPeriod = getWeeklyPeriod()
  const monthlyPeriod = getMonthlyPeriod()

  const filter = { 'owner.type': owner.type, 'owner.id': owner.id, userId: { $exists: false } }

  const [daily, weekly, monthly] = await Promise.all([
    mongo.usage.findOne({ ...filter, period: dailyPeriod }),
    mongo.usage.findOne({ ...filter, period: weeklyPeriod }),
    mongo.usage.findOne({ ...filter, period: monthlyPeriod })
  ])

  return {
    daily: { cost: daily?.cost ?? 0, resetsAt: getDailyResetsAt() },
    weekly: { cost: weekly?.cost ?? 0, resetsAt: getWeeklyResetsAt() },
    monthly: { cost: monthly?.cost ?? 0, resetsAt: getMonthlyResetsAt() }
  }
}

export interface UsageEntry {
  label: string
  cost: number
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

  const records = await mongo.usage.find({
    'owner.type': owner.type,
    'owner.id': owner.id,
    userId: { $exists: false },
    period: { $gte: from, $lte: to }
  }).toArray()

  const byDate = new Map(records.map(r => [r.period.slice(6), r]))

  return dates.map(date => ({
    label: date,
    cost: byDate.get(date)?.cost ?? 0
  }))
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

  return labels.map(label => ({
    label,
    cost: byMonth.get(label)?.cost ?? 0
  }))
}

export async function getUsersDailyHistory (owner: AccountKeys, days: number = 7): Promise<UserDailyHistory[]> {
  const { from, to, dates } = dateRange(days)

  const records = await mongo.usage.find({
    'owner.type': owner.type,
    'owner.id': owner.id,
    userId: { $exists: true },
    period: { $gte: from, $lte: to }
  } as any).toArray()

  const byUser = new Map<string, { dateMap: Map<string, Usage>, userName?: string }>()
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
    entries: dates.map(date => ({
      label: date,
      cost: dateMap.get(date)?.cost ?? 0
    }))
  }))
}
