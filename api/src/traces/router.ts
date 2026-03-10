import { Router } from 'express'
import { assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import agentsMongo from '../mongo.ts'

const router = Router()
export default router

router.get('/:traceId', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const owner = session.account
  assertAccountRole(session, owner, 'admin')

  const { traceId } = req.params

  const events = await agentsMongo.traces
    .find({ traceId, userId: owner.id })
    .sort({ timestamp: 1 })
    .toArray()

  res.json({ results: events, count: events.length })
})
