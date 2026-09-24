/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { getCatalog, resolveRoleDefaults } from '../models/service.ts'
import type { ModelRole } from '../models/operations.ts'

const router = Router()
export default router

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = req.params as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const settings = await getRawSettings(owner)
    const catalog = getCatalog(settings)
    const usage = req.query.usage as ModelRole | undefined
    const results = usage ? catalog.filter(m => m.usage.includes(usage)) : catalog
    // what each role falls back to when left unmapped, shown as the role
    // pickers' placeholder in the org config form
    const defaults = resolveRoleDefaults(settings, catalog)
    res.json({ results, count: results.length, defaults })
  } catch (err) { next(err) }
})
