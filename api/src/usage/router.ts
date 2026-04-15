import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getOwnerUsage, getAccountDailyHistory, getAccountMonthlyHistory, getUsersDailyHistory } from './service.ts'
import { getRawSettings } from '../settings/service.ts'
import config from '#config'

const router = Router()
export default router

const defaultQuotas = {
  global: { unlimited: false, monthlyLimit: 10 },
  admin: { unlimited: true, monthlyLimit: 0 },
  contrib: { unlimited: false, monthlyLimit: 0 },
  user: { unlimited: false, monthlyLimit: 0 },
  external: { unlimited: false, monthlyLimit: 0 },
  anonymous: { unlimited: false, monthlyLimit: 0 }
}

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = req.params as AccountKeys
    assertAccountRole(session, owner, 'admin')

    const period = req.query.period as string | undefined

    const [usage, settings] = await Promise.all([
      getOwnerUsage(owner),
      getRawSettings(owner)
    ])

    const quotas = settings?.quotas ?? defaultQuotas

    const result: Record<string, unknown> = { quotas, currency: config.currency }

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

    if (scope === 'account-monthly') {
      const months = Math.min(Math.max(1, parseInt(req.query.months as string) || 12), 12)
      const entries = await getAccountMonthlyHistory(owner, months)
      res.json({ entries })
    } else if (scope === 'users') {
      const days = Math.min(Math.max(1, parseInt(req.query.days as string) || 7), 30)
      const users = await getUsersDailyHistory(owner, days)
      res.json({ users })
    } else {
      // account-daily
      const days = Math.min(Math.max(1, parseInt(req.query.days as string) || 30), 30)
      const entries = await getAccountDailyHistory(owner, days)
      res.json({ entries })
    }
  } catch (err) {
    next(err)
  }
})
