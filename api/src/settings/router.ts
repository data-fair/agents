/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import * as putReqBody from '#doc/settings/put-req/index.ts'
import { type Settings } from '#types'
import { encryptProviderApiKeys, obfuscateProviderApiKeys } from './operations.ts'
import { securityKey } from '../cipher/service.ts'

const router = Router()
export default router

const emptySettings = (owner: AccountKeys): Settings => ({ owner, providers: [], chatModel: undefined as unknown as Settings['chatModel'] })

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
  const session = reqSessionAuthenticated(req)
  const owner = req.params as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const body = putReqBody.returnValid(req.body, { name: 'body' })

  const existing = await mongo.settings.findOne({ 'owner.type': owner.type, 'owner.id': owner.id })
  const settings = {
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner,
    providers: encryptProviderApiKeys(body.providers || [], existing?.providers || [], securityKey),
    chatModel: body.chatModel,
    summaryModel: body.summaryModel,
    evaluatorModel: body.evaluatorModel
  }
  await mongo.settings.replaceOne({ owner }, settings, { upsert: true })

  console.log(`[audit] settings updated by ${session.account.type}/${session.account.id} (user: ${session.user?.id}) for owner ${owner.type}/${owner.id}`)

  settings.providers = obfuscateProviderApiKeys(settings.providers)
  res.json(settings)
})
