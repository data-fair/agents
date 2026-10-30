/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { getNhiDiscovery, getNhiJwks } from './service.ts'

const router = Router()
export default router

// Both routes are deliberately PUBLIC and unauthenticated: simple-directory fetches
// them server-to-server with no session, and they expose only public keys and two
// urls.
router.get('/.well-known/openid-configuration', (req, res, next) => {
  try {
    res.json(getNhiDiscovery(req))
  } catch (err) { next(err) }
})

router.get('/jwks', async (req, res, next) => {
  try {
    res.json(await getNhiJwks())
  } catch (err) { next(err) }
})
