/**
 * router.ts contains the HTTP layer logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { type AccountKeys, reqSession } from '@data-fair/lib-express'
import { isModerationEnabled, runModeration } from './service.ts'

const router = Router()
export default router

router.get('/:type/:id', async (req, res, next) => {
  try {
    reqSession(req)
    const owner = req.params as unknown as AccountKeys
    res.json({ enabled: await isModerationEnabled(owner) })
  } catch (err) {
    next(err)
  }
})

router.post('/:type/:id', async (req, res, next) => {
  try {
    reqSession(req)
    const owner = req.params as unknown as AccountKeys
    const { message, system } = req.body as { message?: string, system?: string }
    if (typeof message !== 'string' || message.length === 0) {
      res.status(400).json({ error: { message: 'message is required', type: 'invalid_request_error' } })
      return
    }
    res.json(await runModeration(owner, message, system))
  } catch (err) {
    next(err)
  }
})
