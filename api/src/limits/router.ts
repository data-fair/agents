/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 *
 * This is the "customers" ecosystem contract: the separate billing service
 * pushes org-wide AI credit allowances here with a shared secret key, and
 * reads back the consumption counter that recordUsage increments. Nothing
 * here enforces the cap — that is a later task.
 */

import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import mongo from '#mongo'
import config from '#config'
import type { Limits } from '#types'
import * as postReq from '#doc/limits/post-req/index.ts'
import { getLimits } from './service.ts'

const router = Router()
export default router

// Endpoint for the customers service to create/update limits
router.post('/:type/:id', async (req, res, next) => {
  try {
    if (req.query.key !== config.secretKeys.limits) reqAdminMode(req)
    const { body } = postReq.returnValid({ body: req.body }, { name: 'req' })
    const existing = await mongo.limits.findOne({ type: req.params.type, id: req.params.id })
    // preserve locally-tracked consumption when the push omits it
    if (body.ai_credits && body.ai_credits.consumption === undefined && existing?.ai_credits?.consumption !== undefined) {
      body.ai_credits.consumption = existing.ai_credits.consumption
    }
    const newLimits: Limits = { ...body, type: req.params.type, id: req.params.id }
    await mongo.limits.replaceOne({ type: req.params.type, id: req.params.id }, newLimits, { upsert: true })
    res.json(body)
  } catch (err) { next(err) }
})

// Account members (admin not required) can read their own limits; the shared
// key and adminMode also pass. "member" is expressed as the loosest role that
// still ties the session to the account, matching the ecosystem's isAccountMember.
router.get('/:type/:id', async (req, res, next) => {
  try {
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    if (req.query.key !== config.secretKeys.limits) {
      const s = reqSessionAuthenticated(req)
      // allAccounts: true because membership must hold regardless of which
      // account the session currently has "switched" into (the customers
      // service and org members alike query any account they belong to).
      if (!s.user.adminMode) assertAccountRole(s, owner, ['admin', 'contrib', 'user'], { allAccounts: true })
    }
    res.json(await getLimits(owner))
  } catch (err) { next(err) }
})

router.get('/', async (req, res, next) => {
  try {
    if (req.query.key !== config.secretKeys.limits) reqAdminMode(req)
    const filter: Record<string, any> = {}
    if (req.query.type) filter.type = req.query.type
    if (req.query.id) filter.id = req.query.id
    const results = await mongo.limits.find(filter).sort({ lastUpdate: -1 }).project({ _id: 0 }).limit(10000).toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})
