// Strips the `tools` model role from stored settings documents.
//
// WHY: the role existed for sub-agents, which went away; memory consolidation, its last consumer,
// now runs on the assistant role. As with remove-evaluator-role.js, a stored value is not inert: the
// settings PUT validates against a schema that no longer lists `tools` (`additionalProperties: false`
// on `modelMapping`, a closed `oneOf` on `usage`), so the first save of an untouched org form would
// 400 on a value the admin never entered.
//
// The same two shapes as the evaluator script:
//  - `modelMapping.tools`: unset.
//  - a `models` entry flagged `usage: ['tools', ...]`: the role is pulled from the array, and an entry
//    whose ONLY usage was tools is dropped (`minItems: 1`).
//
// In the 0.12.2 folder because 0.12.2 is the current version and every release up to it stores the
// role (see remove-evaluator-role.js for why a lower folder would be skipped).
//
// exec() MUST be idempotent: both halves select only documents that still carry the role.

/**
 * The `models` array with the tools role gone, or null when there was nothing to change.
 * Exported and pure for tests/features/upgrade/remove-tools-role.unit.spec.ts.
 *
 * @param {any[]} models
 * @returns {any[] | null}
 */
export function stripToolsUsage (models) {
  if (!Array.isArray(models)) return null
  if (!models.some(m => Array.isArray(m?.usage) && m.usage.includes('tools'))) return null
  return models
    .map(m => (Array.isArray(m?.usage) ? { ...m, usage: m.usage.filter((/** @type {string} */ u) => u !== 'tools') } : m))
    .filter(m => !Array.isArray(m?.usage) || m.usage.length > 0)
}

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'remove the tools model role from stored settings',

  async exec (db, debug) {
    const settings = db.collection('settings')

    const unmapped = await settings.updateMany(
      { 'modelMapping.tools': { $exists: true } },
      { $unset: { 'modelMapping.tools': '' } }
    )
    debug(`unset modelMapping.tools on ${unmapped.modifiedCount} settings documents`)

    let rewritten = 0
    for await (const doc of settings.find({ 'models.usage': 'tools' })) {
      const models = stripToolsUsage(doc.models)
      if (!models) continue
      await settings.updateOne({ _id: doc._id }, { $set: { models } })
      rewritten++
      debug(`rewrote models of ${doc.owner?.type}/${doc.owner?.id}: ${doc.models.length} entries -> ${models.length}`)
    }
    debug(`rewrote the models array of ${rewritten} settings documents`)
  }
}
