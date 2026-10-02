// Strips the `evaluator` model role from stored settings documents.
//
// WHY: the role existed for the trace evaluator — an in-browser agent that read a recorded
// conversation and judged it. That whole capability is gone (an admin now downloads the
// conversation and analyses it with a standalone coding agent instead), so the role is no longer a
// thing a model can be mapped to. Leaving it stored is not inert: the settings PUT validates its
// body against a schema that no longer lists `evaluator`, with `additionalProperties: false` on
// `modelMapping` and a closed `oneOf` on `usage`, so the first save of an untouched org form would
// 400 on a value the admin never entered.
//
// Two shapes to clean, and the second one is why this is a script rather than a $unset:
//
//  - `modelMapping.evaluator` — just unset.
//  - a `models` entry flagged `usage: ['evaluator', ...]` — the role is pulled from the array, but
//    an entry whose ONLY usage was evaluator cannot keep an empty array (`minItems: 1`), so that
//    entry is dropped entirely. It is also the common case: a deployment that bothered to configure
//    an evaluator usually gave it its own model.
//
// IMPORTANT: this folder only runs once the deployed service version is bumped to 0.12.0 or higher
// (see the upgrade-script runner in api/src/server.ts).
//
// exec() MUST be idempotent (see @data-fair/lib-node/upgrade-scripts.js's UpgradeScript contract):
// the runner re-executes every script whose folder version is >= the recorded service version on
// every deploy of that same release. Both halves below select only documents that still carry the
// role, so a second run matches nothing.

/**
 * The `models` array with the evaluator role gone: pulled from each entry's `usage`, and the entry
 * dropped when that was its only usage. Returns null when there was nothing to change, so the
 * caller can skip the write.
 *
 * Exported and pure so tests/features/upgrade/upgrade.unit.spec.ts can pin the dropped-entry case —
 * the one that loses data, and so must lose exactly the right thing.
 *
 * @param {any[]} models
 * @returns {any[] | null}
 */
export function stripEvaluatorUsage (models) {
  if (!Array.isArray(models)) return null
  if (!models.some(m => Array.isArray(m?.usage) && m.usage.includes('evaluator'))) return null
  return models
    .map(m => (Array.isArray(m?.usage) ? { ...m, usage: m.usage.filter((/** @type {string} */ u) => u !== 'evaluator') } : m))
    .filter(m => !Array.isArray(m?.usage) || m.usage.length > 0)
}

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'remove the evaluator model role from stored settings',

  async exec (db, debug) {
    const settings = db.collection('settings')

    const unmapped = await settings.updateMany(
      { 'modelMapping.evaluator': { $exists: true } },
      { $unset: { 'modelMapping.evaluator': '' } }
    )
    debug(`unset modelMapping.evaluator on ${unmapped.modifiedCount} settings documents`)

    let rewritten = 0
    for await (const doc of settings.find({ 'models.usage': 'evaluator' })) {
      const models = stripEvaluatorUsage(doc.models)
      if (!models) continue
      await settings.updateOne({ _id: doc._id }, { $set: { models } })
      rewritten++
      debug(`rewrote models of ${doc.owner?.type}/${doc.owner?.id}: ${doc.models.length} entries -> ${models.length}`)
    }
    debug(`rewrote the models array of ${rewritten} settings documents`)
  }
}
