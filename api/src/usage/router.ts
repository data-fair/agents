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
