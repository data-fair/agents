import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'
import { incrementConsumption } from '../limits/service.ts'
import { encodeBreakdownKey, decodeBreakdownKey } from './operations.ts'
import type { UsageInfo } from './operations.ts'
export { checkQuota } from './operations.ts'
export type { UsageLimits, UsagePeriodInfo, UsageInfo, QuotaExceeded } from './operations.ts'

/** Dimensions an account-scoped histogram can be stacked by. */
export const USAGE_DIMENSIONS = ['modelRole', 'model', 'profile', 'tokenType'] as const
export type UsageDimension = typeof USAGE_DIMENSIONS[number]

/** The platform-wide histogram adds the owner (account) as a top-level dimension. */
export const PLATFORM_DIMENSIONS = ['owner', ...USAGE_DIMENSIONS] as const
export type PlatformDimension = typeof PLATFORM_DIMENSIONS[number]

/** Credits per dimension value, keyed by encoded value (see encodeBreakdownKey). */
export interface UsageBreakdown {
  modelRole?: Record<string, number>
  model?: Record<string, number>
  profile?: Record<string, number>
  tokenType?: Record<string, number>
}

export interface Usage {
  owner: { type: string, id: string }
  userId?: string
  userName?: string
  period: string // 'daily:2026-03-13' | 'weekly:2026-W11' | 'monthly:2026-03'
  cost: number
  breakdown?: UsageBreakdown
  updatedAt: string
}

/**
 * The extra detail attached to one metered request. Everything except the token
 * costs is a single value: the whole cost is attributed to it (a request used
 * exactly one model role, one model and one caller profile).
 */
export interface UsageDimensions {
  modelRole?: string
  model?: string
  profile?: string
  /** Credits, split by token class (the parts sum to the request cost). */
  tokenCosts?: { input: number, cachedInput: number, output: number }
}

export interface UsageRecord {
  cost: number
  userId?: string
  userName?: string
  poolId?: string
  dimensions?: UsageDimensions
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

export function getMonthlyResetsAt (): string {
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

/**
 * Build the `$inc` document for one recorded request: the scalar cost plus the
 * per-dimension breakdown, on the same document and in a single atomic update.
 */
function recordIncrements ({ cost, dimensions }: UsageRecord): Record<string, number> {
  const inc: Record<string, number> = { cost }
  const addDimension = (dimension: string, value: string | undefined) => {
    if (value) inc[`breakdown.${dimension}.${encodeBreakdownKey(value)}`] = cost
  }
  addDimension('modelRole', dimensions?.modelRole)
  addDimension('model', dimensions?.model)
  addDimension('profile', dimensions?.profile)
  for (const [tokenClass, tokenCost] of Object.entries(dimensions?.tokenCosts ?? {})) {
    if (tokenCost) inc[`breakdown.tokenType.${tokenClass}`] = tokenCost
  }
  return inc
}

export async function recordUsage (owner: AccountKeys, record: UsageRecord): Promise<void> {
  const { cost, userId, userName, poolId } = record
  if (!cost) return
  const now = new Date().toISOString()
  const inc = recordIncrements(record)

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
      $inc: inc,
      $set: setFields,
      $setOnInsert: { ...setOnInsertBase, period }
    },
    { upsert: true }
  )

  const ops: Promise<unknown>[] = [upsertFor(dailyPeriod), upsertFor(weeklyPeriod), upsertFor(monthlyPeriod)]

  // for org owners with per-user tracking, also upsert account-level aggregate records
  if (userId) {
    const accountFilter = { 'owner.type': owner.type, 'owner.id': owner.id, userId: { $exists: false } } as any
    const accountSetOnInsert = { owner: { type: owner.type, id: owner.id } }
    const accountUpsertFor = (period: string) => mongo.usage.updateOne(
      { ...accountFilter, period },
      {
        $inc: inc,
        $set: { updatedAt: now },
        $setOnInsert: { ...accountSetOnInsert, period }
      },
      { upsert: true }
    )
    ops.push(accountUpsertFor(dailyPeriod), accountUpsertFor(weeklyPeriod), accountUpsertFor(monthlyPeriod))
  }

  // also upsert the shared pool aggregate (e.g. combined anonymous + external usage)
  if (poolId) {
    const poolFilter = { 'owner.type': owner.type, 'owner.id': owner.id, userId: poolId }
    const poolSetOnInsert = { owner: { type: owner.type, id: owner.id }, userId: poolId }
    const poolUpsertFor = (period: string) => mongo.usage.updateOne(
      { ...poolFilter, period },
      {
        $inc: inc,
        $set: { updatedAt: now },
        $setOnInsert: { ...poolSetOnInsert, period }
      },
      { upsert: true }
    )
    ops.push(poolUpsertFor(dailyPeriod), poolUpsertFor(weeklyPeriod), poolUpsertFor(monthlyPeriod))
  }

  // keep the customers-facing credit consumption counter in sync
  ops.push(incrementConsumption(owner, cost))

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
  /** Present when a breakdown dimension was requested: decoded value → credits. */
  breakdown?: Record<string, number>
}

export interface UserDailyHistory {
  userId: string
  userName?: string
  entries: UsageEntry[]
}

export interface PlatformHistory {
  entries: UsageEntry[]
  owners: { type: string, id: string }[]
}

function decodeBreakdown (breakdown: UsageBreakdown | undefined, dimension: UsageDimension): Record<string, number> {
  const values = breakdown?.[dimension]
  if (!values) return {}
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [decodeBreakdownKey(key), value]))
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

export async function getAccountDailyHistory (owner: AccountKeys, days: number = 30, dimension?: UsageDimension): Promise<UsageEntry[]> {
  const { from, to, dates } = dateRange(days)

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
      cost: record?.cost ?? 0,
      ...(dimension ? { breakdown: decodeBreakdown(record?.breakdown, dimension) } : {})
    }
  })
}

export async function getAccountMonthlyHistory (owner: AccountKeys, months: number = 12, dimension?: UsageDimension): Promise<UsageEntry[]> {
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
      cost: record?.cost ?? 0,
      ...(dimension ? { breakdown: decodeBreakdown(record?.breakdown, dimension) } : {})
    }
  })
}

export async function getUsersDailyHistory (owner: AccountKeys, days: number = 7, dimension?: UsageDimension): Promise<UserDailyHistory[]> {
  const { from, to, dates } = dateRange(days)

  const records = await mongo.usage.find({
    'owner.type': owner.type,
    'owner.id': owner.id,
    userId: { $exists: true },
    period: { $gte: from, $lte: to }
  } as any).toArray()

  const byUser = new Map<string, { dateMap: Map<string, Usage>, userName?: string }>()
  for (const r of records) {
    // skip shared pool aggregates (e.g. pool:untrusted) — they are not real users
    if (!r.userId || r.userId.startsWith('pool:')) continue
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
        cost: record?.cost ?? 0,
        ...(dimension ? { breakdown: decodeBreakdown(record?.breakdown, dimension) } : {})
      }
    })
  }))
}

export function ownerKey (owner: { type: string, id: string }): string {
  return `${owner.type}/${owner.id}`
}

/**
 * Platform-wide history for superadmins: one bucket per date/month across every
 * owner, stackable by owner or by any account-level dimension. Reads the
 * account-level records only (the per-user ones would double count).
 */
async function getPlatformHistory (periods: string[], slice: number, dimension: PlatformDimension, ownerFilter?: AccountKeys): Promise<PlatformHistory> {
  const from = periods[0]
  const to = periods[periods.length - 1]

  const records = await mongo.usage.find({
    userId: { $exists: false },
    period: { $gte: from, $lte: to }
  } as any).toArray()

  const owners = new Map<string, { type: string, id: string }>()
  const byPeriod = new Map<string, Usage[]>()
  for (const r of records) {
    owners.set(ownerKey(r.owner), r.owner)
    const key = r.period.slice(slice)
    if (!byPeriod.has(key)) byPeriod.set(key, [])
    byPeriod.get(key)!.push(r)
  }

  const entries = periods.map(period => {
    const label = period.slice(slice)
    const matching = (byPeriod.get(label) ?? []).filter(r =>
      !ownerFilter || (r.owner.type === ownerFilter.type && r.owner.id === ownerFilter.id)
    )
    const breakdown: Record<string, number> = {}
    const add = (key: string, value: number) => { breakdown[key] = (breakdown[key] ?? 0) + value }
    for (const r of matching) {
      if (dimension === 'owner') add(ownerKey(r.owner), r.cost)
      else for (const [key, value] of Object.entries(decodeBreakdown(r.breakdown, dimension))) add(key, value)
    }
    return { label, cost: matching.reduce((sum, r) => sum + r.cost, 0), breakdown }
  })

  return {
    entries,
    owners: Array.from(owners.values()).sort((a, b) => ownerKey(a).localeCompare(ownerKey(b)))
  }
}

export async function getPlatformDailyHistory (days: number = 30, dimension: PlatformDimension = 'owner', ownerFilter?: AccountKeys): Promise<PlatformHistory> {
  const { dates } = dateRange(days)
  return getPlatformHistory(dates.map(d => `daily:${d}`), 6, dimension, ownerFilter)
}

export async function getPlatformMonthlyHistory (months: number = 12, dimension: PlatformDimension = 'owner', ownerFilter?: AccountKeys): Promise<PlatformHistory> {
  const { labels } = monthRange(months)
  return getPlatformHistory(labels.map(m => `monthly:${m}`), 8, dimension, ownerFilter)
}
