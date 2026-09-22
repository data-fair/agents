import { Router } from 'express'
import { type AccountKeys, assertAccountRole, httpError, isValidAccountType, reqSessionAuthenticated } from '@data-fair/lib-express'
import {
  getOwnerUsage,
  getAccountDailyHistory,
  getAccountMonthlyHistory,
  getUsersDailyHistory,
  getPlatformDailyHistory,
  getPlatformMonthlyHistory,
  USAGE_DIMENSIONS,
  PLATFORM_DIMENSIONS,
  type UsageDimension,
  type PlatformDimension
} from './service.ts'
import { getRawSettings, defaultQuotas } from '../settings/service.ts'
import { getCreditInfo } from '../limits/service.ts'

const router = Router()
export default router

function parseDimension (raw: unknown, allowed: readonly string[]): string | undefined {
  if (raw === undefined || raw === '') return undefined
  const dimension = String(raw)
  if (!allowed.includes(dimension)) throw httpError(400, `invalid dimension: ${dimension}`)
  return dimension
}

function parseAccount (req: any): AccountKeys | undefined {
  const type = req.query.ownerType
  const id = req.query.ownerId
  if (type === undefined && id === undefined) return undefined
  if (!type || !id) throw httpError(400, 'ownerType and ownerId must be provided together')
  const typeStr = String(type)
  if (!isValidAccountType(typeStr)) throw httpError(400, `invalid ownerType: ${typeStr}`)
  return { type: typeStr, id: String(id) }
}

// Platform-wide monitoring, superadmin only: the same shapes as the account
// history, with every owner's account-level records summed per period, so the
// histogram can be stacked by owner (the default) or by any account dimension.
router.get('/history', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    if (!session.user?.isAdmin) throw httpError(403, 'super admin only')

    const scope = (req.query.scope as string) || 'platform-daily'
    const dimension = (parseDimension(req.query.dimension, PLATFORM_DIMENSIONS) ?? 'owner') as PlatformDimension
    const ownerFilter = parseAccount(req)

    if (scope === 'platform-monthly') {
      const months = Math.min(Math.max(1, parseInt(req.query.months as string) || 12), 12)
      const history = await getPlatformMonthlyHistory(months, dimension, ownerFilter)
      res.json(history)
    } else {
      const days = Math.min(Math.max(1, parseInt(req.query.days as string) || 30), 30)
      const history = await getPlatformDailyHistory(days, dimension, ownerFilter)
      res.json(history)
    }
  } catch (err) {
    next(err)
  }
})

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = req.params as AccountKeys
    assertAccountRole(session, owner, 'admin')

    const period = req.query.period as string | undefined

    const [usage, settings, credits] = await Promise.all([
      getOwnerUsage(owner),
      getRawSettings(owner),
      getCreditInfo(owner)
    ])

    const quotas = settings?.quotas ?? defaultQuotas

    const result: Record<string, unknown> = { quotas, credits }

    if (!period || period === 'daily') result.daily = usage.daily
    if (!period || period === 'weekly') result.weekly = usage.weekly
    if (!period || period === 'monthly') result.monthly = usage.monthly

    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/:type/:id/history', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = req.params as AccountKeys
    assertAccountRole(session, owner, 'admin')

    const scope = (req.query.scope as string) || 'account-daily'
    const dimension = parseDimension(req.query.dimension, USAGE_DIMENSIONS) as UsageDimension | undefined

    if (scope === 'account-monthly') {
      const months = Math.min(Math.max(1, parseInt(req.query.months as string) || 12), 12)
      const entries = await getAccountMonthlyHistory(owner, months, dimension)
      res.json({ entries })
    } else if (scope === 'users') {
      const days = Math.min(Math.max(1, parseInt(req.query.days as string) || 7), 30)
      const users = await getUsersDailyHistory(owner, days, dimension)
      res.json({ users })
    } else {
      // account-daily
      const days = Math.min(Math.max(1, parseInt(req.query.days as string) || 30), 30)
      const entries = await getAccountDailyHistory(owner, days, dimension)
      res.json({ entries })
    }
  } catch (err) {
    next(err)
  }
})
