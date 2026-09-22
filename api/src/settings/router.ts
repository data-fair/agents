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

  // Only read the existing providers, to preserve the encrypted API key of a
  // provider whose apiKey came back as the obfuscated placeholder — this read
  // is not used to reconstruct the rest of the document (see below).
  const existing = await mongo.settings.findOne({ 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { providers: 1 } })
  const providers = encryptProviderApiKeys(body.providers, existing?.providers || [], securityKey)
  const now = new Date().toISOString()

  // A partial update, not a whole-document replace: this route owns only
  // providers/models, so it must only ever touch those two fields (plus
  // updatedAt). Anything else — modelMapping/quotas/moderation/storeTraces —
  // is owned by the org PUT and must survive untouched here, including one
  // that lands concurrently between this handler's read and write above.
  await mongo.settings.updateOne(
    { 'owner.type': owner.type, 'owner.id': owner.id },
    {
      $set: { providers, updatedAt: now, ...(body.models ? { models: body.models } : {}) },
      // Persist the model catalog exactly as the form represents it: it is
      // hidden until a provider exists, so an empty config legitimately has
      // no `models` key. Unsetting it here (rather than writing an empty
      // value) keeps the form from reporting a spurious diff on the next
      // load (it strips the hidden, empty value). Readers treat an absent
      // `models` as an empty catalog contribution.
      ...(body.models ? {} : { $unset: { models: '' } }),
      $setOnInsert: { owner, createdAt: now, quotas: defaultQuotas, moderation: defaultModeration, storeTraces: false }
    },
    { upsert: true }
  )

  eventsLog.info('agents.settings.update', `settings updated for owner ${owner.type}/${owner.id}`, { req })

  const updated = await getSettings(owner)
  updated.providers = obfuscateProviderApiKeys(updated.providers)
  res.json(updated)
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
