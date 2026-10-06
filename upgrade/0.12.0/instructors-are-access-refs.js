// Turns the old instructor list into uniform access refs.
//
// WHY: instructors used to be `{ userId, userName }` objects — a shape private to this service, with
// the display name denormalized into every document and no way to grant to an email, a partner
// organization or a role/department. The list is now `AccessRef[]` (lib-common-types), the same shape
// every other permission list in the stack uses, and the one `matchAccessRef` knows how to match.
//
// IMPORTANT: this folder only runs once the deployed service version is bumped to 0.12.0 or higher
// (see the upgrade-script runner in api/src/server.ts) — the release that adopts this change MUST ship
// at least 0.12.0, or this migration silently never executes and existing grants stop matching.
//
// exec() MUST be idempotent (see @data-fair/lib-node/upgrade-scripts.js's UpgradeScript contract): the
// query matches only documents still holding an item with `userId`, and items already in the new shape
// are carried through untouched.

const COLLECTION = 'autonomous-agents'

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'turn instructors {userId} into access refs',

  async exec (db, debug) {
    const collection = db.collection(COLLECTION)
    const cursor = collection.find({ instructors: { $elemMatch: { userId: { $exists: true } } } })
    let migrated = 0
    for await (const doc of cursor) {
      // `userName` is dropped rather than kept: AccessRef has no name, and the pickers resolve names
      // from simple-directory. A mixed list (some old items, some new) keeps the new ones as they are.
      const instructors = (doc.instructors ?? []).map((/** @type {any} */ instructor) =>
        instructor.userId !== undefined && instructor.userId !== null
          ? { mode: 'member', type: 'user', id: instructor.userId }
          : instructor
      )
      await collection.updateOne({ _id: doc._id }, { $set: { instructors } })
      migrated++
    }
    debug(`${migrated} autonomous agent(s) migrated to access-ref instructors`)
  }
}
