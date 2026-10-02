// Renames the conversation collections and the field that named their agent.
//
// WHY: `autonomous-agent-conversations`, `-messages` and `-runs` were created when only autonomous
// agents had conversations. With the loop on the server every ordinary chat is one of these, so the
// names described the first caller rather than the thing — and that was not cosmetic. It is why
// usage billed every chat turn as the agent at role 'admin', why a quota refusal told a person
// "this autonomous agent could not run", and why a plain org member was locked out of their own
// assistant. Three defects, all downstream of a name that had stopped being true.
//
// `autonomousAgentId` becomes `agentId` for the same reason: the value is `'personal'` for a chat.
//
// IMPORTANT: this folder only runs once the deployed service version is bumped to 0.12.0 or higher
// (see the upgrade-script runner in api/src/server.ts) — the release that adopts this rename MUST
// ship at least 0.12.0, or this migration silently never executes and the service starts reading
// empty collections.
//
// exec() MUST be idempotent (see @data-fair/lib-node/upgrade-scripts.js's UpgradeScript contract):
// the runner re-executes every script whose folder version is >= the recorded service version on
// every deploy of that same release, not just once. Both halves below are written to be re-runnable
// — a rename is skipped when the source is absent, and the field update matches only documents that
// still carry the old key.

const RENAMES = [
  ['autonomous-agent-conversations', 'conversations'],
  ['autonomous-agent-messages', 'messages'],
  ['autonomous-agent-runs', 'runs']
]

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'rename the conversation collections and autonomousAgentId -> agentId',

  async exec (db, debug) {
    /** @type {Set<string>} */
    const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((/** @type {any} */ c) => c.name))

    for (const [from, to] of RENAMES) {
      if (!existing.has(from)) {
        debug(`${from} is absent, nothing to rename`)
        continue
      }
      if (existing.has(to)) {
        // Both present. This happens for real: a service that starts on the renamed code before this
        // migration shipped will have had mongo auto-create the new collections on first write.
        const inTarget = await db.collection(to).countDocuments({}, { limit: 1 })
        if (inTarget > 0) {
          // Non-empty: a previous run renamed AND the service has since written to it. Merging two
          // populated collections is not this script's call — stop loudly rather than pick one.
          throw new Error(`both ${from} and ${to} hold documents; refusing to guess which is current`)
        }
        // Empty: there is nothing to lose, and the alternative is a service that cannot start.
        await db.collection(to).drop()
        debug(`dropped the empty ${to} left by a service that started before this migration`)
      }
      await db.renameCollection(from, to)
      debug(`renamed ${from} -> ${to}`)
    }

    // The field, on the two collections that carry it. Matched on the OLD key so a re-run is a no-op
    // rather than a rewrite of every document.
    for (const name of ['conversations', 'messages']) {
      const result = await db.collection(name).updateMany(
        { autonomousAgentId: { $exists: true } },
        { $rename: { autonomousAgentId: 'agentId' } }
      )
      debug(`${name}: renamed autonomousAgentId on ${result.modifiedCount} document(s)`)
    }
    // Runs carry it too.
    const runs = await db.collection('runs').updateMany(
      { autonomousAgentId: { $exists: true } },
      { $rename: { autonomousAgentId: 'agentId' } }
    )
    debug(`runs: renamed autonomousAgentId on ${runs.modifiedCount} document(s)`)

    // The indexes are declared by name in api/src/mongo.ts and reconciled at boot, so they are not
    // renamed here: `renameCollection` carries the index DEFINITIONS across, and the boot
    // reconciliation drops any whose key no longer matches a declaration. One of them keys on
    // `autonomousAgentId` and will be replaced that way.
  }
}
