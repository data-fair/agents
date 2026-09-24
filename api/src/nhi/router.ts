/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { httpError } from '@data-fair/lib-express'
import { nhiEnabled, getNhiDiscovery, getNhiJwks } from './service.ts'

const router = Router()
export default router

// Both routes are deliberately PUBLIC and unauthenticated: simple-directory fetches
// them server-to-server with no session, and they expose only a public key and two
// urls. When the feature is off they 404, matching simple-directory's own behaviour
// for a deployment with manageNhis disabled.
router.get('/.well-known/openid-configuration', (req, res, next) => {
  try {
    if (!nhiEnabled()) throw httpError(404, 'not found')
    res.json(getNhiDiscovery(req))
  } catch (err) { next(err) }
})

router.get('/jwks', (req, res, next) => {
  try {
    if (!nhiEnabled()) throw httpError(404, 'not found')
    res.json(getNhiJwks())
  } catch (err) { next(err) }
})
