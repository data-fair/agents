import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getOwnerUsage } from './service.ts'
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

    const limits = settings?.limits ?? { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    const userLimits = settings?.userLimits

    const result: Record<string, unknown> = { limits }
    if (userLimits) result.userLimits = userLimits

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
