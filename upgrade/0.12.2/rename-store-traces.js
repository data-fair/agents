// Renames the `storeTraces` settings field to `reviewPersonalAssistant`.
//
// WHY: there are no traces any more — review reads the conversation itself (see
// docs/architecture/conversation-review.md) — and the field no longer governs storage either: an
// autonomous agent's conversations are reviewable whatever it says. What it decides is whether admins
// may review consented personal-assistant conversations, so it is named for that. Left under its old
// name it would be silently ignored, which turns review off for every account that had it on.
//
// In the 0.12.2 folder because 0.12.2 is the current version and every release up to it stores the
// field: a lower folder would be skipped by deployments already recorded at 0.12.x. Idempotent: only
// documents still carrying the old name match, so a second run renames nothing.

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'rename settings.storeTraces to settings.reviewPersonalAssistant',

  async exec (db, debug) {
    const renamed = await db.collection('settings').updateMany(
      { storeTraces: { $exists: true } },
      { $rename: { storeTraces: 'reviewPersonalAssistant' } }
    )
    debug(`renamed storeTraces on ${renamed.modifiedCount} settings documents`)
  }
}
