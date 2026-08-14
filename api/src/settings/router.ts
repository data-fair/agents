/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, httpError, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import * as putReqBody from '#doc/settings/put-req/index.ts'
import * as orgPutReqBody from '#doc/settings/org-put-req/index.ts'
import { type Settings } from '#types'
import { encryptProviderApiKeys, obfuscateProviderApiKeys } from './operations.ts'
import { defaultQuotas, defaultModeration, emptySettings, getSettings } from './service.ts'
import { getCatalog } from '../models/service.ts'
import type { ModelRole } from '../models/operations.ts'
import { securityKey } from '../cipher/service.ts'

const router = Router()
export default router

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
    // The org-owned fields are not part of this (superadmin-scoped) body
    // anymore — carry them over from the existing doc untouched, falling back
    // to the same defaults as before so a first-ever save still gets a usable
    // document.
    quotas: existing?.quotas ?? defaultQuotas,
    storeTraces: existing?.storeTraces ?? false,
    moderation: existing?.moderation ?? defaultModeration
  }
  if (existing?.modelMapping) settings.modelMapping = existing.modelMapping
  // Persist the model catalog exactly as the form represents it: it is hidden
  // until a provider exists, so an empty config legitimately has no `models`
  // key. Injecting an empty value here would make the form report a spurious
  // diff on the next load (it strips the hidden, empty value). Readers treat
  // an absent `models` as an empty catalog contribution.
  if (body.models) settings.models = body.models
  await mongo.settings.replaceOne({ owner }, settings, { upsert: true })

  eventsLog.info('agents.settings.update', `settings updated for owner ${owner.type}/${owner.id}`, { req })

  settings.providers = obfuscateProviderApiKeys(settings.providers)
  res.json(settings)
})

router.put('/:type/:id/org', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const body = orgPutReqBody.returnValid(req.body, { name: 'body' })

    // validate mapping refs against the catalog (existence + usage flag)
    const existingSettings = await getSettings(owner)
    const catalog = getCatalog(existingSettings)
    for (const [role, ref] of Object.entries(body.modelMapping ?? {})) {
      if (!ref) continue
      const entry = catalog.find(m => m.provider.id === ref.provider && m.id === ref.id)
      if (!entry) throw httpError(400, `unknown model ${ref.provider}/${ref.id} for role ${role}`)
      if (!entry.usage.includes(role as ModelRole)) throw httpError(400, `model ${ref.provider}/${ref.id} is not flagged for usage ${role}`)
    }

    const now = new Date().toISOString()
    await mongo.settings.updateOne(
      { 'owner.type': owner.type, 'owner.id': owner.id },
      {
        $set: {
          modelMapping: body.modelMapping ?? {},
          quotas: body.quotas ?? defaultQuotas,
          moderation: body.moderation ?? defaultModeration,
          storeTraces: body.storeTraces ?? false,
          updatedAt: now
        },
        $setOnInsert: { owner, createdAt: now, providers: [], models: [] }
      },
      { upsert: true }
    )
    eventsLog.info('agents.settings.org-update', `org settings updated for owner ${owner.type}/${owner.id}`, { req })
    const updated = await getSettings(owner)
    updated.providers = obfuscateProviderApiKeys(updated.providers)
    res.json(updated)
  } catch (err) { next(err) }
})
