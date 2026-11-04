// Replaces an autonomous agent's `approvalLevel` with `approvalRoutes`.
//
// WHY: the approval gate became a reviewer (api/src/approval-review): every write and destructive call is
// reviewed before it runs, and each class's route says whether a person decides after the reviewer. The
// agent schema forbids extra properties, so an agent still carrying `approvalLevel` would fail its next save.
// The field was never in a release tag, but deployments of main (staging) stored it: cleaned here.
//
// Each level keeps at least the checks it had, with the reviewer added in front:
//  - `write` (a person for every change): both routes `reviewer+person`.
//  - `destructive` (the old default): no routes stored, the defaults (write `reviewer`, destructive
//    `reviewer+person`) being the same person on destructive calls, plus a review of writes.
//  - `none` (no person): both routes `reviewer`, the nearest: there is no unchecked route any more.
// Routes already stored are kept as they are.
//
// In the 0.12.2 folder because 0.12.2 is the current version. Idempotent: only documents still carrying
// `approvalLevel` match, and each loses it.

/**
 * The routes an approval level becomes, or undefined for the defaults.
 *
 * @param {unknown} level
 * @returns {{ write: string, destructive: string } | undefined}
 */
export function routesForLevel (level) {
  if (level === 'write') return { write: 'reviewer+person', destructive: 'reviewer+person' }
  if (level === 'none') return { write: 'reviewer', destructive: 'reviewer' }
  return undefined
}

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'replace autonomous agents\' approvalLevel with approvalRoutes',

  async exec (db, debug) {
    const agents = db.collection('autonomous-agents')
    let migrated = 0
    for await (const doc of agents.find({ approvalLevel: { $exists: true } }, { projection: { _id: 1, approvalLevel: 1, approvalRoutes: 1 } })) {
      const routes = doc.approvalRoutes ? undefined : routesForLevel(doc.approvalLevel)
      await agents.updateOne({ _id: doc._id }, { $unset: { approvalLevel: '' }, ...(routes ? { $set: { approvalRoutes: routes } } : {}) })
      migrated++
      debug(`agent ${doc._id}: approvalLevel ${doc.approvalLevel} -> ${routes ? JSON.stringify(routes) : 'default routes'}`)
    }
    debug(`migrated approvalLevel on ${migrated} autonomous agents`)
  }
}
