// Migrates settings docs from the pre-0.10.0 shape (models keyed by role,
// quotas.global) to the new shape (models array + modelMapping, no
// quotas.global) introduced by the config refactor, and seeds the org-wide
// credit limit (Task 4's `limits` collection) from the old quotas.global.
//
// IMPORTANT: this folder only runs once the deployed service version is
// bumped to 0.10.0 or higher (see the upgrade-script runner in
// api/src/server.ts) — the release that adopts this refactor MUST ship at
// least 0.10.0, or this migration silently never executes.
//
// RELEASE NOTE — the carried-over number changes units. `quotas.global.
// monthlyLimit` is copied 1:1 into `ai_credits.limit` below, but it used to
// be a currency budget compared against a cost derived from each model's
// (now-deleted) inputPricePerMillion/outputPricePerMillion, and is now
// compared against token-derived credits with a default multiplier of 1.
// The same number therefore buys a different amount of usage post-upgrade,
// by a factor that depends on each org's old model prices. See
// docs/architecture/configuration.md#release-note-caps-shift-units-on-upgrade
// — operators must review every migrated org's ai_credits.limit (and model
// multipliers) after upgrading.
//
// exec() MUST be idempotent (see @data-fair/lib-node/upgrade-scripts.js's
// UpgradeScript contract): the runner re-executes every script whose folder
// version is >= the recorded service version on every deploy of that same
// release (e.g. repeated staging deploys before the next version bump), not
// just once. transformSettingsDoc() returning null for anything that is
// already in the new shape is what makes repeat runs a no-op.

const ROLES = ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']

// Duplicated from api/src/settings/operations.ts (re-exported by
// api/src/settings/service.ts), WHICH IS THE SOURCE OF TRUTH: this script is
// plain ESM run against a raw mongo handle by the upgrade-script runner, and
// resolving api/src's `#config`/`#mongo` import aliases from here is not
// possible, so it cannot import them. tests/features/upgrade/upgrade.unit.spec.ts
// asserts these copies stay deep-equal to the exported originals, so drift
// fails the build rather than silently changing what migrated docs get.
const DEFAULT_QUOTAS = {
  admin: { unlimited: true, monthlyLimit: 0 },
  contrib: { unlimited: false, monthlyLimit: 0 },
  user: { unlimited: false, monthlyLimit: 0 },
  external: { unlimited: false, monthlyLimit: 0 },
  anonymous: { unlimited: false, monthlyLimit: 0 },
  untrusted: { unlimited: false, monthlyLimit: 0 }
}

const DEFAULT_MODERATION = {
  enabled: false,
  categories: ['anonymous', 'external']
}

export { DEFAULT_QUOTAS, DEFAULT_MODERATION }

/**
 * Pure transform: old (role-keyed `models` + `quotas.global`) settings doc ->
 * new (`models` array + `modelMapping`, org-wide credit limit) shape.
 *
 * Returns null when there is nothing to migrate:
 *  - `models` is already an array: either an already-migrated doc, or a
 *    brand-new-format doc revisited by a same-version repeat run — either
 *    way it is already in the target shape, so it's a safe no-op.
 *  - `models` is neither an array nor an old-style role-keyed object (i.e.
 *    absent), AND `quotas.global` is also missing: this combination can only
 *    occur on a genuinely new-format doc that has providers configured but
 *    no role models chosen yet — the settings PUT route only writes `models`
 *    when the form actually sends it (see api/src/settings/router.ts), and
 *    the new quotas shape never has a `global` key at all, so the absence of
 *    both is the tell that there is nothing old-shaped here. Treating this
 *    as "nothing to do" (rather than writing a spurious `models: []`) avoids
 *    the settings form reporting a diff it shouldn't for a key that
 *    legitimately never existed.
 *
 * Any other doc migrates. Deliberately, `models` being an old-style
 * role-keyed object is on its own a sufficient (not merely a supporting)
 * reason to migrate, independent of whether `quotas.global` is present:
 * the old top-level Settings schema only ever required `['owner',
 * 'providers']` (`quotas` was never a required key), so historical data
 * predating today's `quotas: body.quotas ?? defaultQuotas` PUT-route
 * fallback can plausibly have old-shaped `models` with no `quotas.global` at
 * all. Skipping such a doc (returning null) would leave `models` as a plain
 * object forever — Task 3's `getModelCatalog` does `for (const om of
 * orgModels)` over it and throws on a non-array, so this doc would silently
 * break model resolution for that org at every request rather than being
 * fixed once, here. See the "no role models, no quotas.global" unit test.
 *
 * @param {any} doc a raw `settings` collection document
 * @returns {{ settings: any, creditLimit: number | undefined } | null}
 */
export function transformSettingsDoc (doc) {
  if (Array.isArray(doc.models)) return null
  const hasOldModels = doc.models !== undefined && doc.models !== null && typeof doc.models === 'object'
  const hadGlobalQuota = Object.prototype.hasOwnProperty.call(doc.quotas ?? {}, 'global')
  if (!hasOldModels && !hadGlobalQuota) return null

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

  // doc.quotas (and within it, .global) may be entirely absent on data old
  // enough to predate the quotas feature itself — see the doc comment above.
  // NORMALIZE rather than copy: writing the raw leftovers would turn a doc with
  // no quotas at all into `quotas: {}`, and an empty object is truthy, so the
  // readers' `settings.quotas ?? defaultQuotas` fallback (api/src/gateway/
  // router.ts, api/src/summary/router.ts) would stop firing and assertRoleQuota
  // (api/src/auth.ts) would 403 EVERY caller, account admins included, with no
  // UI affordance to repair it. Same for moderation: a doc predating the
  // moderation feature must come out of the migration with the default, or the
  // org config form (ui/src/components/OrgConfigSection.vue) reports a
  // permanent unsaved change against the schema default vjsf materializes.
  const { global: globalQuota, ...roleQuotas } = doc.quotas ?? {}
  const settings = { ...doc, models, quotas: { ...DEFAULT_QUOTAS, ...roleQuotas }, moderation: doc.moderation ?? DEFAULT_MODERATION }
  if (Object.keys(modelMapping).length) settings.modelMapping = modelMapping
  else delete settings.modelMapping

  // Old enforcement (`if (globalLimits && !globalLimits.unlimited && globalLimits.monthlyLimit)`)
  // treated a falsy monthlyLimit (0, or the key absent) as "no cap", same as the
  // untrusted-pool convention the schema still documents. The new guard
  // (`limit >= 0 && consumption >= limit`) has no such carve-out: any concrete
  // number, including 0, hard-caps at zero. Map both "unlimited" and "falsy
  // monthlyLimit" to -1 so a migrated org's effective budget is unchanged.
  const creditLimit = globalQuota ? ((globalQuota.unlimited || !globalQuota.monthlyLimit) ? -1 : globalQuota.monthlyLimit) : undefined

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

      // Seed the credit limit BEFORE flipping the settings doc to the new shape.
      // If the process dies between the two writes, a doc left old-shaped is
      // re-picked-up (and re-seeded, idempotently) by the resumed run; the
      // reverse order would let a crash leave the doc new-shaped with no
      // limits doc ever written, silently falling back to the unlimited
      // config default.
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

      const { _id, ...settingsWithoutId } = result.settings
      await db.collection('settings').replaceOne({ _id: doc._id }, { ...settingsWithoutId, updatedAt: new Date().toISOString() })
      debug(`migrated settings for ${doc.owner?.type}/${doc.owner?.id}`)
    }
  }
}
