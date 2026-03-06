import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import * as putReqBody from '#doc/settings/put-req/index.ts'
import { getSettings, putSettings } from './service.ts'
import { type Settings } from '#types'

const router = Router()
export default router

const emptySettings = (owner: AccountKeys): Settings => ({ owner, providers: [], agents: {} })

router.get('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as AccountKeys
  assertAccountRole(session, owner, 'admin')

  const settings = await getSettings(owner)

  if (!settings) {
    res.json(emptySettings(owner))
    return
  }

  res.json(settings)
})

router.put('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const body = putReqBody.returnValid(req.body, { name: 'body' })

  const settings = await putSettings(owner, body)
  res.json(settings)
})
