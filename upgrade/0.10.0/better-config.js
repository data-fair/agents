// Migrates settings docs from the pre-0.10.0 shape (models keyed by role,
// quotas.global) to the new shape (models array + modelMapping, no
// quotas.global) introduced by the config refactor, and seeds the org-wide
// credit limit (Task 4's `limits` collection) from the old quotas.global.
//
// exec() MUST be idempotent (see @data-fair/lib-node/upgrade-scripts.js's
// UpgradeScript contract): the runner re-executes every script whose folder
// version is >= the recorded service version on every deploy of that same
// release (e.g. repeated staging deploys before the next version bump), not
// just once. transformSettingsDoc() returning null for anything that is
// already in the new shape is what makes repeat runs a no-op.

const ROLES = ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']

/**
 * Pure transform: old (role-keyed `models` + `quotas.global`) settings doc ->
 * new (`models` array + `modelMapping`, org-wide credit limit) shape.
 *
 * Returns null when there is nothing to migrate:
 *  - `models` is already an array: either an already-migrated doc, or a
 *    brand-new-format doc revisited by a same-version repeat run — either
 *    way it is already in the target shape, so it's a safe no-op.
 *  - `models` is missing entirely AND `quotas.global` is also missing: this
 *    combination can only occur on a genuinely new-format doc that has
 *    providers configured but no role models chosen yet — the settings PUT
 *    route only writes `models` when the form actually sends it (see
 *    api/src/settings/router.ts), and the new quotas shape never has a
 *    `global` key at all, so its absence is the tell that there is nothing
 *    old-shaped here. Treating this as "nothing to do" (rather than writing
 *    a spurious `models: []`) avoids the settings form reporting a diff it
 *    shouldn't for a key that legitimately never existed.
 *  - Any other doc (has `quotas.global`, `models` absent or an old-style
 *    role-keyed object) is old-format and gets migrated, even if it has no
 *    role models configured — the quotas.global -> credit limit conversion
 *    still applies.
 *
 * @param {any} doc a raw `settings` collection document
 * @returns {{ settings: any, creditLimit: number } | null}
 */
export function transformSettingsDoc (doc) {
  if (Array.isArray(doc.models)) return null
  const hadGlobalQuota = Object.prototype.hasOwnProperty.call(doc.quotas ?? {}, 'global')
  if (!hadGlobalQuota) return null

  /** @type {any[]} */
  const models = []
  /** @type {Record<string, any>} */
  const modelMapping = {}
  for (const role of ROLES) {
    const entry = doc.models?.[role]
    if (!entry?.model) continue
    const existing = models.find(m => m.model.provider.id === entry.model.provider.id && m.model.id === entry.model.id)
    if (existing) {
      if (!existing.usage.includes(role)) existing.usage.push(role)
    } else {
      models.push({ model: { id: entry.model.id, name: entry.model.name, provider: entry.model.provider }, usage: [role], multiplier: 1 })
    }
    modelMapping[role] = { provider: entry.model.provider.id, id: entry.model.id, name: entry.model.name }
  }

  const { global: globalQuota, ...roleQuotas } = doc.quotas
  const settings = { ...doc, models, quotas: roleQuotas }
  if (Object.keys(modelMapping).length) settings.modelMapping = modelMapping
  else delete settings.modelMapping

  const creditLimit = globalQuota.unlimited ? -1 : (globalQuota.monthlyLimit ?? 0)

  return { settings, creditLimit }
}

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'migrate settings to the models array / modelMapping / credit limit structure introduced by the config refactor',
  async exec (db, debug) {
    const cursor = db.collection('settings').find({})
    for await (const doc of cursor) {
      const result = transformSettingsDoc(doc)
      if (!result) continue

      const { _id, ...settingsWithoutId } = result.settings
      await db.collection('settings').replaceOne({ _id: doc._id }, { ...settingsWithoutId, updatedAt: new Date().toISOString() })
      debug(`migrated settings for ${doc.owner?.type}/${doc.owner?.id}`)

      if (result.creditLimit !== undefined) {
        await db.collection('limits').updateOne(
          { type: doc.owner.type, id: doc.owner.id },
          {
            $set: { 'ai_credits.limit': result.creditLimit, lastUpdate: new Date().toISOString() },
            $setOnInsert: { type: doc.owner.type, id: doc.owner.id, name: doc.owner.name ?? doc.owner.id, defaults: true }
          },
          { upsert: true }
        )
        debug(`seeded credit limit ${result.creditLimit} for ${doc.owner?.type}/${doc.owner?.id}`)
      }
    }
  }
}
