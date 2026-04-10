import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getOwnerUsage, getAccountDailyHistory, getAccountMonthlyHistory, getUsersDailyHistory } from './service.ts'
import { getRawSettings } from '../settings/service.ts'

const router = Router()
export default router

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

    const quotas = settings?.quotas ?? {
      global: { unlimited: false, dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 },
      admin: { unlimited: true, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
      contrib: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
      user: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
      external: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 }
    }

    const result: Record<string, unknown> = { quotas }

    if (!period || period === 'daily') {
      result.daily = usage.daily
    }
    if (!period || period === 'monthly') {
      result.monthly = usage.monthly
    }

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
