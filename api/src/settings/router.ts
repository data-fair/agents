/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import * as putReqBody from '#doc/settings/put-req/index.ts'
import { type Settings } from '#types'
import { encryptProviderApiKeys, obfuscateProviderApiKeys } from './operations.ts'
import { defaultQuotas } from './service.ts'
import { securityKey } from '../cipher/service.ts'

const router = Router()
export default router

const emptySettings = (owner: AccountKeys): Settings => ({ owner, providers: [], quotas: defaultQuotas, storeTraces: false })

router.get('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as AccountKeys
  assertAccountRole(session, owner, 'admin')

  const settings = await mongo.settings.findOne({ 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
  if (!settings) {
    res.json(emptySettings(owner))
    return
  }

  settings.providers = obfuscateProviderApiKeys(settings.providers)
  res.json(settings)
})

router.put('/:type/:id', async (req, res, next) => {
  const session = reqAdminMode(req)
  const owner = req.params as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const body = putReqBody.returnValid(req.body, { name: 'body' })

  const existing = await mongo.settings.findOne({ 'owner.type': owner.type, 'owner.id': owner.id })
  const settings: Settings = {
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner,
    providers: encryptProviderApiKeys(body.providers || [], existing?.providers || [], securityKey),
    quotas: body.quotas ?? defaultQuotas,
    storeTraces: body.storeTraces ?? false
  }
  // Persist models exactly as the form represents them: the model-role sections
  // are hidden until a provider exists, so an empty config legitimately has no
  // models key. Injecting an empty object here would make the form report a
  // spurious diff on the next load (it strips the hidden, empty value).
  if (body.models) settings.models = body.models
  await mongo.settings.replaceOne({ owner }, settings, { upsert: true })

  eventsLog.info('agents.settings.update', `settings updated for owner ${owner.type}/${owner.id}`, { req })

  settings.providers = obfuscateProviderApiKeys(settings.providers)
  res.json(settings)
})
